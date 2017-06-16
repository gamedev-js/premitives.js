window.initMeshDraw = function (meshData) {
  let { vec3, mat4 } = window.vmath;
  let device = window.device;
  let gfx = window.gfx;
  let resl = window.resl;
  let { wireframe, normals } = window.primitives;

  function _mesh(device, data) {
    //
    let program = new gfx.Program(device, {
      vert: `
      precision highp float;
      attribute vec3 a_position;
      attribute vec3 a_normal;
      attribute vec2 a_uv;

      uniform mat4 model, view, projection, modelNormal;

      varying vec2 uv;

      void main () {
        vec4 pos = projection * view * model * vec4(a_position, 1);
        uv = a_uv;

        gl_Position = pos;
      }
    `,
      frag: `
      precision highp float;
      uniform sampler2D texture;
      uniform vec4 color;

      varying vec2 uv;

      void main () {
        gl_FragColor = texture2D(texture, uv) * color;

        if (!gl_FrontFacing) {
          gl_FragColor *= 0.4;
        }
      }
    `,
    });
    program.link();

    let verts = [];
    for (let i = 0; i < data.positions.length / 3; ++i) {
      verts.push(data.positions[3 * i], data.positions[3 * i + 1], data.positions[3 * i + 2]);
      verts.push(data.normals[3 * i], data.normals[3 * i + 1], data.normals[3 * i + 2]);
      verts.push(data.uvs[2 * i], data.uvs[2 * i + 1]);
    }

    let vb = new gfx.VertexBuffer(
      device,
      new gfx.VertexFormat([
        { name: gfx.ATTR_POSITION, type: gfx.ATTR_TYPE_FLOAT32, num: 3 },
        { name: gfx.ATTR_NORMAL, type: gfx.ATTR_TYPE_FLOAT32, num: 3 },
        { name: gfx.ATTR_UV, type: gfx.ATTR_TYPE_FLOAT32, num: 2 },
      ]),
      gfx.USAGE_STATIC,
      new Float32Array(verts),
      data.positions.length / 3,
      false
    );

    let ib = new gfx.IndexBuffer(
      device,
      gfx.INDEX_FMT_UINT16,
      gfx.USAGE_STATIC,
      new Uint16Array(data.indices),
      data.indices.length,
      false
    );

    // normals
    let nprogram = new gfx.Program(device, {
      vert: `
      precision highp float;
      attribute vec3 a_position;

      uniform mat4 model, view, projection;

      void main () {
        vec4 pos = projection * view * model * vec4(a_position, 1);
        gl_Position = pos;
      }
    `,
      frag: `
      precision highp float;
      uniform vec4 color;

      void main () {
        gl_FragColor = color;
      }
    `,
    });
    nprogram.link();

    let nverts = normals(data.positions, data.normals, 0.05);
    let nvb = new gfx.VertexBuffer(
      device,
      new gfx.VertexFormat([
        { name: gfx.ATTR_POSITION, type: gfx.ATTR_TYPE_FLOAT32, num: 3 },
      ]),
      gfx.USAGE_STATIC,
      new Float32Array(nverts),
      nverts.length / 3,
      false
    );

    // wireframe
    let windices = wireframe(data.indices);
    let wib = new gfx.IndexBuffer(
      device,
      gfx.INDEX_FMT_UINT16,
      gfx.USAGE_STATIC,
      new Uint16Array(windices),
      windices.length,
      false
    );

    let wprogram = new gfx.Program(device, {
      vert: `
      precision highp float;
      attribute vec3 a_position;
      attribute vec3 a_normal;
      attribute vec2 a_uv;

      uniform mat4 model, view, projection, modelNormal;

      varying vec2 uv;
      varying vec3 positionW;
      varying vec3 normalW;

      void main () {
        vec4 pos = projection * view * model * vec4(a_position, 1);
        uv = a_uv;
        positionW = (model * vec4(a_position, 1)).xyz;
        normalW = (modelNormal * vec4(a_normal, 1)).xyz;

        gl_Position = pos;
      }
    `,
      frag: `
      precision highp float;
      uniform vec3 eye;
      uniform vec4 color;

      varying vec2 uv;
      varying vec3 positionW;
      varying vec3 normalW;

      void main () {
        gl_FragColor = color;

        vec3 e2p = normalize(eye - positionW);
        if (dot (normalW, e2p) <= 0.0) {
          gl_FragColor.rgb *= 0.4;
        }
      }
    `,
    });
    wprogram.link();

    return {
      program, vb, ib,
      nprogram, nvb,
      wprogram, wib
    };
  }

  let time = 0;
  let mesh = _mesh(device, meshData);
  let pos = vec3.create();
  let model = mat4.create();
  let modelNormal = mat4.create();
  let texture = null;
  // let textureWhite = new gfx.Texture2D(device, {
  //   width: 1,
  //   height: 1,
  //   wrapS: gfx.WRAP_CLAMP,
  //   wrapT: gfx.WRAP_CLAMP,
  //   mipmap: true,
  //   images: [new Uint8Array([255, 255, 255, 255])]
  // });

  resl({
    manifest: {
      image: {
        type: 'image',
        src: './assets/uv_checker_02.jpg'
      },
    },
    onDone(assets) {
      let image = assets.image;
      texture = new gfx.Texture2D(device, {
        width: image.width,
        height: image.height,
        wrapS: gfx.WRAP_CLAMP,
        wrapT: gfx.WRAP_CLAMP,
        mipmap: true,
        images: [image]
      });
    }
  });

  // tick
  return function tick(dt) {
    time += dt;

    if (texture) {
      // solid
      mat4.fromTranslation(model, vec3.set(pos, 0, 0, 0));

      device.setCullMode(gfx.CULL_NONE);
      device.enableDepthTest();
      device.enableDepthWrite();
      device.setVertexBuffer(0, mesh.vb);
      device.setIndexBuffer(mesh.ib);
      device.setUniform('color', new Float32Array([1, 1, 1, 1]));
      device.setUniform('model', mat4.array(new Float32Array(16), model));
      device.setTexture('texture', texture, 0);
      device.setProgram(mesh.program);
      device.draw(0, mesh.ib.count);

      // solid (progress)
      mat4.fromTranslation(model, vec3.set(pos, -2, 0, 0));
      let cnt = Math.ceil(time % 10.0 / 10.0 * mesh.ib.count);

      device.setCullMode(gfx.CULL_NONE);
      device.enableDepthTest();
      device.enableBlend();
      device.setBlendFunc(gfx.BLEND_SRC_ALPHA, gfx.BLEND_ONE_MINUS_SRC_ALPHA);
      device.setVertexBuffer(0, mesh.vb);
      device.setIndexBuffer(mesh.ib);
      device.setUniform('color', new Float32Array([1, 1, 1, 0.5]));
      device.setUniform('model', mat4.array(new Float32Array(16), model));
      device.setTexture('texture', texture, 0);
      device.setProgram(mesh.program);
      device.draw(0, cnt);

      // wireframe
      mat4.fromTranslation(model, vec3.set(pos, 2, 0, 0));
      mat4.transpose(modelNormal, mat4.invert(modelNormal, model));

      device.setPrimitiveType(gfx.PT_LINES);
      device.setCullMode(gfx.CULL_NONE);
      device.enableDepthTest();
      device.enableDepthWrite();
      device.setVertexBuffer(0, mesh.vb);
      device.setIndexBuffer(mesh.wib);
      device.setUniform('color', new Float32Array([1, 1, 1, 1]));
      device.setUniform('model', mat4.array(new Float32Array(16), model));
      device.setUniform('modelNormal', mat4.array(new Float32Array(16), modelNormal));
      device.setProgram(mesh.wprogram);
      device.draw(0, mesh.wib.count);

      // normals
      device.setPrimitiveType(gfx.PT_LINES);
      device.setCullMode(gfx.CULL_NONE);
      device.enableDepthTest();
      device.enableDepthWrite();
      device.setVertexBuffer(0, mesh.nvb);
      device.setUniform('color', new Float32Array([0, 1, 0, 1]));
      device.setProgram(mesh.nprogram);
      device.draw(0, mesh.nvb.count);
    }
  };
};