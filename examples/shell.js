let orbit = new window.Orbit(null, {
  eye: window.vmath.vec3.new(0, 5, 10),
  phi: window.vmath.toRadian(-30),
});

function _loadPromise(url) {
  return new Promise((resolve, reject) => {
    let xhr = new window.XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.onreadystatechange = onreadystatechange;
    xhr.send(null);

    function onreadystatechange(e) {
      if (xhr.readyState !== 4) {
        return;
      }

      // Testing harness file:/// results in 0.
      if ([0, 200, 304].indexOf(xhr.status) === -1) {
        reject(`While loading from url ${url} server responded with a status of ${xhr.status}`);
      } else {
        resolve(e.target.response);
      }
    }
  });
}

function _load(view, url) {
  if (!url) {
    return;
  }

  if (window.reqID) {
    window.cancelAnimationFrame(window.reqID);
  }

  _loadPromise(url).then(result => {
    // destroy old instances
    if (view.firstElementChild) {
      view.firstElementChild.remove();
    }
    if (window.input) {
      window.input.destroy();
      window.input = null;
    }

    //
    let canvas = document.createElement('canvas');
    canvas.classList.add('fit');
    canvas.tabIndex = -1;
    view.appendChild(canvas);

    window.canvas = canvas;
    window.device = new window.gfx.Device(canvas);
    window.input = new window.Input(canvas, {
      lock: true
    });

    orbit._input = window.input;
    let drawGrid = _grid(window.device, 100, 100, 100);
    let drawMesh = null;
    let lasttime = 0;

    // update
    function animate(timestamp) {
      if (timestamp === undefined) {
        timestamp = 0;
      }
      let dt = (timestamp - lasttime)/1000;
      lasttime = timestamp;

      window.stats.tick();
      orbit.tick(dt, canvas.width, canvas.height);

      window.device.setViewport(0, 0, canvas.width, canvas.height);
      window.device.clear({
        color: [0.3, 0.3, 0.3, 1],
        depth: 1
      });
      window.device.setUniform('eye', orbit._cache.eye);
      window.device.setUniform('view', orbit._cache.view);
      window.device.setUniform('projection', orbit._cache.proj);

      if (drawMesh) {
        drawMesh(dt);
      }

      drawGrid();

      window.input.reset();

      window.reqID = requestAnimationFrame(animate);
    }

    window.reqID = window.requestAnimationFrame(() => {
      _resize();

      let meshData = eval(`${result}\n//# sourceURL=${url}`);
      drawMesh = window.initMeshDraw(meshData);
      animate();
    });

  }).catch(err => {
    console.error(err);
  });
}

function _resize() {
  if (!window.canvas) {
    return;
  }

  let bcr = window.canvas.parentElement.getBoundingClientRect();
  window.canvas.width = bcr.width;
  window.canvas.height = bcr.height;

  if (window.input) {
    window.input.resize();
  }
}

function _grid(device, width, length, seg) {
  const gfx = window.gfx;
  let program = new gfx.Program(device, {
    vert: `
      precision mediump float;
      uniform mat4 view, projection;

      attribute vec3 a_position;

      void main() {
        vec4 pos = projection * view * vec4(a_position, 1);

        gl_Position = pos;
      }
    `,
    frag: `
      precision mediump float;
      uniform vec4 color;

      void main () {
        gl_FragColor = color;
      }
    `,
  });
  program.link();

  let vertices = [];
  let hw = width * 0.5;
  let hl = length * 0.5;
  let dw = width / seg;
  let dl = length / seg;

  for (let x = -hw; x <= hw; x += dw) {
    vertices.push(x, 0, -hl);
    vertices.push(x, 0, hl);
  }

  for (let z = -hl; z <= hl; z += dl) {
    vertices.push(-hw, 0, z);
    vertices.push(hw, 0, z);
  }

  let vertexFmt = new gfx.VertexFormat([
    { name: gfx.ATTR_POSITION, type: gfx.ATTR_TYPE_FLOAT32, num: 3 },
  ]);
  let vertexBuffer = new gfx.VertexBuffer(
    device,
    vertexFmt,
    gfx.USAGE_STATIC,
    new Float32Array(vertices),
    vertices.length/3
  );

  let color = new Float32Array([0.5, 0.5, 0.5, 0.2]);

  return function () {
    device.setPrimitiveType(gfx.PT_LINES);
    device.enableDepthTest();
    device.enableBlend();
    device.setBlendFunc(gfx.BLEND_SRC_ALPHA, gfx.BLEND_ONE_MINUS_SRC_ALPHA);
    device.setVertexBuffer(0, vertexBuffer);
    device.setUniform('color', color);
    device.setProgram(program);
    device.draw(0, vertexBuffer.count);
  };
}

document.addEventListener('readystatechange', () => {
  if ( document.readyState !== 'complete' ) {
    return;
  }

  let view = document.getElementById('view');
  let showFPS = document.getElementById('showFPS');
  let exampleList = document.getElementById('exampleList');

  // update profile
  showFPS.checked = localStorage.getItem('primitives.showFPS') === 'true';
  let exampleIndex = parseInt(localStorage.getItem('primitives.exampleIndex'));
  if (isNaN(exampleIndex)) {
    exampleIndex = 0;
  }
  exampleList.selectedIndex = exampleIndex;

  // init
  let stats = new window.LStats(document.body);
  showFPS.checked ? stats.show() : stats.hide();

  window.stats = stats;
  _load(view, exampleList.value);

  window.addEventListener('resize', () => {
    _resize();
  });

  showFPS.addEventListener('click', event => {
    localStorage.setItem('primitives.showFPS', event.target.checked);
    if (event.target.checked) {
      stats.show();
    } else {
      stats.hide();
    }
  });

  exampleList.addEventListener('change', event => {
    localStorage.setItem('primitives.exampleIndex', event.target.selectedIndex);
    _load(view, exampleList.value);
  });
});