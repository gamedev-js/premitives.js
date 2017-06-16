
/*
 * primitives.js v1.0.0
 * (c) 2017 @Johnny Wu
 * Released under the MIT License.
 */

var primitives = (function (vmath) {
'use strict';

/**
 * @param {Array} indices
 */
function wireframe(indices) {
  const offsets = [[0, 1], [1, 2], [2, 0]];
  let lines = [];
  let lineIDs = {};

  for (let i = 0; i < indices.length; i += 3) {
    for (let k = 0; k < 3; ++k) {
      let i1 = indices[i + offsets[k][0]];
      let i2 = indices[i + offsets[k][1]];

      // check if we already have the line in our lines
      let id = (i1 > i2) ? ((i2 << 16) | i1) : ((i1 << 16) | i2);
      if (lineIDs[id] === undefined) {
        lineIDs[id] = 0;
        lines.push(i1, i2);
      }
    }
  }

  return lines;
}

/**
 * @param {Array} positions
 * @param {Array} normals
 * @param {Number} length
 */
function normals(positions, normals, length = 1) {
  let verts = new Array(2 * positions.length);

  for (let i = 0; i < positions.length/3; ++i) {
    let i3 = 3*i;
    let i6 = 6*i;

    // line start
    verts[i6 + 0] = positions[i3 + 0];
    verts[i6 + 1] = positions[i3 + 1];
    verts[i6 + 2] = positions[i3 + 2];

    // line end
    verts[i6 + 3] = positions[i3 + 0] + normals[i3 + 0] * length;
    verts[i6 + 4] = positions[i3 + 1] + normals[i3 + 1] * length;
    verts[i6 + 5] = positions[i3 + 2] + normals[i3 + 2] * length;
  }

  return verts;
}

let temp1 = vmath.vec3.create();
let temp2 = vmath.vec3.create();
let temp3 = vmath.vec3.create();
let r = vmath.vec3.create();
let c0 = vmath.vec3.create();
let c1 = vmath.vec3.create();
let c2 = vmath.vec3.create();
let c3 = vmath.vec3.create();
let c4 = vmath.vec3.create();
let c5 = vmath.vec3.create();
let c6 = vmath.vec3.create();
let c7 = vmath.vec3.create();

/**
 * @param {Number} width
 * @param {Number} height
 * @param {Number} length
 * @param {Object} opts
 * @param {Number} opts.widthSegments
 * @param {Number} opts.heightSegments
 * @param {Number} opts.lengthSegments
 */
var box = function (width, height, length, opts = {}) {
  let ws = opts.widthSegments !== undefined ? opts.widthSegments : 1;
  let hs = opts.heightSegments !== undefined ? opts.heightSegments : 1;
  let ls = opts.lengthSegments !== undefined ? opts.lengthSegments : 1;

  let hw = width * 0.5;
  let hh = height * 0.5;
  let hl = length * 0.5;

  let corners = [
    vmath.vec3.set(c0, -hw, -hh,  hl),
    vmath.vec3.set(c1,  hw, -hh,  hl),
    vmath.vec3.set(c2,  hw,  hh,  hl),
    vmath.vec3.set(c3, -hw,  hh,  hl),
    vmath.vec3.set(c4,  hw, -hh, -hl),
    vmath.vec3.set(c5, -hw, -hh, -hl),
    vmath.vec3.set(c6, -hw,  hh, -hl),
    vmath.vec3.set(c7,  hw,  hh, -hl),
  ];

  let faceAxes = [
    [ 0, 1, 3 ], // FRONT
    [ 4, 5, 7 ], // BACK
    [ 3, 2, 6 ], // TOP
    [ 1, 0, 4 ], // BOTTOM
    [ 1, 4, 2 ], // RIGHT
    [ 5, 0, 6 ]  // LEFT
  ];

  let faceNormals = [
    [  0,  0,  1 ], // FRONT
    [  0,  0, -1 ], // BACK
    [  0,  1,  0 ], // TOP
    [  0, -1,  0 ], // BOTTOM
    [  1,  0,  0 ], // RIGHT
    [ -1,  0,  0 ]  // LEFT
  ];

  let positions = [];
  let normals = [];
  let uvs = [];
  let indices = [];

  function _buildPlane (side, uSegments, vSegments) {
    let u, v;
    let ix, iy;
    let offset = positions.length / 3;
    let faceAxe = faceAxes[side];
    let faceNormal = faceNormals[side];

    for (iy = 0; iy <= vSegments; iy++) {
      for (ix = 0; ix <= uSegments; ix++) {
        u = ix / uSegments;
        v = iy / vSegments;

        vmath.vec3.lerp(temp1, corners[faceAxe[0]], corners[faceAxe[1]], u);
        vmath.vec3.lerp(temp2, corners[faceAxe[0]], corners[faceAxe[2]], v);
        vmath.vec3.sub(temp3, temp2, corners[faceAxe[0]]);
        vmath.vec3.add(r, temp1, temp3);

        positions.push(r.x, r.y, r.z);
        normals.push(faceNormal[0], faceNormal[1], faceNormal[2]);
        uvs.push(u, v);

        if ((ix < uSegments) && (iy < vSegments)) {
          let useg1 = uSegments + 1;
          let a = ix + iy * useg1;
          let b = ix + (iy + 1) * useg1;
          let c = (ix + 1) + (iy + 1) * useg1;
          let d = (ix + 1) + iy * useg1;

          indices.push(offset + a, offset + d, offset + b);
          indices.push(offset + d, offset + c, offset + b);
        }
      }
    }
  }

  _buildPlane(0, ws, hs); // FRONT
  _buildPlane(4, ls, hs); // RIGHT
  _buildPlane(1, ws, hs); // BACK
  _buildPlane(5, ls, hs); // LEFT
  _buildPlane(3, ws, ls); // BOTTOM
  _buildPlane(2, ws, ls); // TOP

  return {
    positions,
    normals,
    uvs,
    indices,
  };
};

let temp1$1 = vmath.vec3.create();
let temp2$1 = vmath.vec3.create();

/**
 * @param {Number} radiusTop
 * @param {Number} radiusBottom
 * @param {Number} height
 * @param {Object} opts
 * @param {Number} opts.radialSegments
 * @param {Number} opts.heightSegments
 * @param {Boolean} opts.capped
 * @param {Number} opts.arc
 */
var cylinder = function (radiusTop = 0.5, radiusBottom = 0.5, height = 1, opts = {}) {
  let halfHeight = height * 0.5;
  let radialSegments = opts.radialSegments || 8;
  let heightSegments = opts.heightSegments || 1;
  let capped = opts.capped !== undefined ? opts.capped : true;
  let arc = opts.arc || 2.0 * Math.PI;

  let cntCap = 0;
  if (!capped) {
    if (radiusTop > 0) {
      cntCap++;
    }

    if (radiusBottom > 0) {
      cntCap++;
    }
  }

  // calculate vertex count
  let vertCount = (radialSegments + 1) * (heightSegments + 1);
  if (capped) {
    vertCount += ((radialSegments + 1) * cntCap) + (radialSegments * cntCap);
  }

  // calculate index count
  let indexCount = radialSegments * heightSegments * 2 * 3;
  if (capped) {
    indexCount += radialSegments * cntCap * 3;
  }

  let indices = new Array(indexCount);
  let positions = new Array(vertCount * 3);
  let normals = new Array(vertCount * 3);
  let uvs = new Array(vertCount * 2);

  let index = 0;
  let indexOffset = 0;

  generateTorso();

  if (capped) {
    if (radiusBottom > 0) {
      generateCap(false);
    }

    if (radiusTop > 0) {
      generateCap(true);
    }
  }

  return {
    positions,
    normals,
    uvs,
    indices,
  };

  // =======================
  // internal fucntions
  // =======================

  function generateTorso() {
    let indexArray = [];

    // this will be used to calculate the normal
    let slope = (radiusTop - radiusBottom) / height;

    // generate positions, normals and uvs
    for (let y = 0; y <= heightSegments; y++) {
      let indexRow = [];
      let v = y / heightSegments;

      // calculate the radius of the current row
      let radius = v * (radiusTop - radiusBottom) + radiusBottom;

      for (let x = 0; x <= radialSegments; ++x) {
        let u = x / radialSegments;
        let theta = u * arc;

        let sinTheta = Math.sin(theta);
        let cosTheta = Math.cos(theta);

        // vertex
        positions[3 * index] = radius * sinTheta;
        positions[3 * index + 1] = v * height - halfHeight;
        positions[3 * index + 2] = radius * cosTheta;

        // normal
        vmath.vec3.normalize(temp1$1, vmath.vec3.set(temp2$1, sinTheta, -slope, cosTheta));
        normals[3 * index] = temp1$1.x;
        normals[3 * index + 1] = temp1$1.y;
        normals[3 * index + 2] = temp1$1.z;

        // uv
        uvs[2 * index] = u;
        uvs[2 * index + 1] = v;

        // save index of vertex in respective row
        indexRow.push(index);

        // increase index
        ++index;
      }

      // now save positions of the row in our index array
      indexArray.push(indexRow);
    }

    // generate indices
    for (let y = 0; y < heightSegments; ++y) {
      for (let x = 0; x < radialSegments; ++x) {
        // we use the index array to access the correct indices
        let i1 = indexArray[y][x];
        let i2 = indexArray[y + 1][x];
        let i3 = indexArray[y + 1][x + 1];
        let i4 = indexArray[y][x + 1];

        // face one
        indices[indexOffset] = i1; ++indexOffset;
        indices[indexOffset] = i4; ++indexOffset;
        indices[indexOffset] = i2; ++indexOffset;

        // face two
        indices[indexOffset] = i4; ++indexOffset;
        indices[indexOffset] = i3; ++indexOffset;
        indices[indexOffset] = i2; ++indexOffset;
      }
    }
  }

  function generateCap(top) {
    let centerIndexStart, centerIndexEnd;

    let radius = top ? radiusTop : radiusBottom;
    let sign = top ? 1 : - 1;

    // save the index of the first center vertex
    centerIndexStart = index;

    // first we generate the center vertex data of the cap.
    // because the geometry needs one set of uvs per face,
    // we must generate a center vertex per face/segment

    for (let x = 1; x <= radialSegments; ++x) {
      // vertex
      positions[3 * index] = 0;
      positions[3 * index + 1] = halfHeight * sign;
      positions[3 * index + 2] = 0;

      // normal
      normals[3 * index] = 0;
      normals[3 * index + 1] = sign;
      normals[3 * index + 2] = 0;

      // uv
      uvs[2 * index] = 0.5;
      uvs[2 * index + 1] = 0.5;

      // increase index
      ++index;
    }

    // save the index of the last center vertex
    centerIndexEnd = index;

    // now we generate the surrounding positions, normals and uvs

    for (let x = 0; x <= radialSegments; ++x) {
      let u = x / radialSegments;
      let theta = u * arc;

      let cosTheta = Math.cos(theta);
      let sinTheta = Math.sin(theta);

      // vertex
      positions[3 * index] = radius * sinTheta;
      positions[3 * index + 1] = halfHeight * sign;
      positions[3 * index + 2] = radius * cosTheta;

      // normal
      normals[3 * index] = 0;
      normals[3 * index + 1] = sign;
      normals[3 * index + 2] = 0;

      // uv
      uvs[2 * index] = 0.5 - (cosTheta * 0.5);
      uvs[2 * index + 1] = (sinTheta * 0.5 * sign) + 0.5;

      // increase index
      ++index;
    }

    // generate indices

    for (let x = 0; x < radialSegments; ++x) {
      let c = centerIndexStart + x;
      let i = centerIndexEnd + x;

      if (top) {
        // face top
        indices[indexOffset] = i + 1; ++indexOffset;
        indices[indexOffset] = c;     ++indexOffset;
        indices[indexOffset] = i;     ++indexOffset;
      } else {
        // face bottom
        indices[indexOffset] = c;     ++indexOffset;
        indices[indexOffset] = i + 1; ++indexOffset;
        indices[indexOffset] = i;     ++indexOffset;
      }
    }
  }
};

/**
 * @param {Number} radius
 * @param {Number} height
 * @param {Object} opts
 * @param {Number} opts.radialSegments
 * @param {Number} opts.heightSegments
 * @param {Boolean} opts.capped
 * @param {Number} opts.arc
 */
var cone = function (radius = 0.5, height = 1, opts = {}) {
  return cylinder(0, radius, height, opts);
};

let temp1$2 = vmath.vec3.create();
let temp2$2 = vmath.vec3.create();
let temp3$1 = vmath.vec3.create();
let r$1 = vmath.vec3.create();
let c00 = vmath.vec3.create();
let c10 = vmath.vec3.create();
let c01 = vmath.vec3.create();

/**
 * @param {Number} width
 * @param {Number} length
 * @param {Object} opts
 * @param {Number} opts.widthSegments
 * @param {Number} opts.lengthSegments
 */
var plane = function (width, length, opts = {}) {
  let uSegments = opts.widthSegments !== undefined ? opts.widthSegments : 5;
  let vSegments = opts.lengthSegments !== undefined ? opts.lengthSegments : 5;

  let hw = width * 0.5;
  let hl = length * 0.5;

  let positions = [];
  let normals = [];
  let uvs = [];
  let indices = [];

  vmath.vec3.set(c00, -hw, 0,  hl);
  vmath.vec3.set(c10,  hw, 0,  hl);
  vmath.vec3.set(c01, -hw, 0, -hl);

  for (let y = 0; y <= vSegments; y++) {
    for (let x = 0; x <= uSegments; x++) {
      let u = x / uSegments;
      let v = y / vSegments;

      vmath.vec3.lerp(temp1$2, c00, c10, u);
      vmath.vec3.lerp(temp2$2, c00, c01, v);
      vmath.vec3.sub(temp3$1, temp2$2, c00);
      vmath.vec3.add(r$1, temp1$2, temp3$1);

      positions.push(r$1.x, r$1.y, r$1.z);
      normals.push(0, 1, 0);
      uvs.push(u, v);

      if ((x < uSegments) && (y < vSegments)) {
        let useg1 = uSegments + 1;
        let a = x + y * useg1;
        let b = x + (y + 1) * useg1;
        let c = (x + 1) + (y + 1) * useg1;
        let d = (x + 1) + y * useg1;

        indices.push(a, d, b);
        indices.push(d, c, b);
      }
    }
  }

  return {
    positions,
    normals,
    uvs,
    indices,
  };
};

let positions = [
  -0.5, -0.5, 0, // bottom-left
  -0.5,  0.5, 0, // top-left
   0.5,  0.5, 0, // top-right
   0.5, -0.5, 0, // bottom-right
];

let normals$1 = [
  0, 0, 1,
  0, 0, 1,
  0, 0, 1,
  0, 0, 1,
];

let uvs = [
  0, 0,
  0, 1,
  1, 1,
  1, 0,
];

let indices = [
  0, 3, 1,
  3, 2, 1
];

var quad = function () {
  return {
    positions: positions,
    indices: indices,
    normals: normals$1,
    uvs: uvs,
  };
};

/**
 * @param {Number} radius
 * @param {Object} opts
 * @param {Number} opts.segments
 */
var sphere = function (radius = 1, opts = {}) {
  let segments = opts.segments !== undefined ? opts.segments : 16;

  // lat === latitude
  // lon === longitude

  let positions = [];
  let normals = [];
  let uvs = [];
  let indices = [];

  for (let lat = 0; lat <= segments; ++lat) {
    let theta = lat * Math.PI / segments;
    let sinTheta = Math.sin(theta);
    let cosTheta = -Math.cos(theta);

    for (let lon = 0; lon <= segments; ++lon) {
      let phi = lon * 2 * Math.PI / segments - Math.PI / 2.0;
      let sinPhi = Math.sin(phi);
      let cosPhi = Math.cos(phi);

      let x = sinPhi * sinTheta;
      let y = cosTheta;
      let z = cosPhi * sinTheta;
      let u = lon / segments;
      let v = lat / segments;

      positions.push(x * radius, y * radius, z * radius);
      normals.push(x, y, z);
      uvs.push(u, v);


      if ((lat < segments) && (lon < segments)) {
        let seg1 = segments + 1;
        let a = seg1 * lat + lon;
        let b = seg1 * (lat + 1) + lon;
        let c = seg1 * (lat + 1) + lon + 1;
        let d = seg1 * lat + lon + 1;

        indices.push(a, d, b);
        indices.push(d, c, b);
      }
    }
  }

  return {
    positions: positions,
    indices: indices,
    normals: normals,
    uvs: uvs
  };
};

/**
 * @param {Number} radius
 * @param {Number} tube
 * @param {Object} opts
 * @param {Number} opts.radialSegments
 * @param {Number} opts.tubularSegments
 * @param {Number} opts.arc
 */
var torus = function (radius = 0.5, tube = 0.2, opts = {}) {
  let radialSegments = opts.radialSegments || 30;
  let tubularSegments = opts.tubularSegments || 20;
  let arc = opts.arc || 2.0 * Math.PI;

  let positions = [];
  let normals = [];
  let uvs = [];
  let indices = [];

  for (let j = 0; j <= radialSegments; j++) {
    for (let i = 0; i <= tubularSegments; i++) {
      let u = i / tubularSegments;
      let v = j / radialSegments;

      let u1 = u * arc;
      let v1 = v * Math.PI * 2;

      // vertex
      let x = (radius + tube * Math.cos(v1)) * Math.sin(u1);
      let y = tube * Math.sin(v1);
      let z = (radius + tube * Math.cos(v1)) * Math.cos(u1);

      // this vector is used to calculate the normal
      let nx = Math.sin(u1) * Math.cos(v1);
      let ny = Math.sin(v1);
      let nz = Math.cos(u1) * Math.cos(v1);

      positions.push(x, y, z);
      normals.push(nx, ny, nz);
      uvs.push(u, v);

      if ((i < tubularSegments) && (j < radialSegments)) {
        let seg1 = tubularSegments + 1;
        let a = seg1 * j + i;
        let b = seg1 * (j + 1) + i;
        let c = seg1 * (j + 1) + i + 1;
        let d = seg1 * j + i + 1;

        indices.push(a, d, b);
        indices.push(d, c, b);
      }
    }
  }

  return {
    positions,
    normals,
    uvs,
    indices,
  };
};

var index = {
  // utils
  wireframe,
  normals,

  // shapes
  box,
  cone,
  cylinder,
  plane,
  quad,
  sphere,
  torus,
};

return index;

}(window.vmath));
//# sourceMappingURL=primitives.dev.js.map
