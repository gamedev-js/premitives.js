'use strict';

import { vec3 } from 'vmath';

let temp1 = vec3.create();
let temp2 = vec3.create();

/**
 * @param {Number} radiusTop
 * @param {Number} radiusBottom
 * @param {Number} height
 * @param {Object} opts
 * @param {Number} opts.sides
 * @param {Number} opts.heightSegments
 * @param {Boolean} opts.capped
 * @param {Number} opts.arc
 */
export default function (radiusTop = 0.5, radiusBottom = 0.5, height = 2, opts = {}) {
  let torsoHeight = height - radiusTop - radiusBottom;
  let halfHeight = torsoHeight * 0.5;
  let sides = opts.sides || 16;
  let heightSegments = opts.heightSegments || 10;
  let buttonProp = radiusBottom/height;
  let torProp = (height-radiusBottom-radiusTop)/height;
  let topProp = radiusTop/height;
  let buttonSegments = Math.floor(heightSegments * buttonProp);
  let topSegments = Math.floor(heightSegments * topProp);
  let torSegments = Math.floor(heightSegments * torProp);

  let arc = opts.arc || 2.0 * Math.PI;

  // calculate vertex count
  let positions = [];
  let normals = [];
  let uvs = [];
  let indices = [];

  let index = 0;
  let indexArray = [];

  generateButton();

  generateTorso();

  generateTop();

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
    // this will be used to calculate the normal
    let slope = (radiusTop - radiusBottom) / torsoHeight;

    // generate positions, normals and uvs
    for (let y = 0; y <= torSegments; y++) {

      let indexRow = [];
      let v = y / torSegments;
      let radius = v * (radiusTop - radiusBottom) + radiusBottom;

      for (let x = 0; x <= sides; ++x) {
        let u = x / sides;
        let theta = u * arc - (arc / 4);

        let sinTheta = Math.sin(theta);
        let cosTheta = Math.cos(theta);

        // vertex
        positions.push(radius * sinTheta);
        positions.push(v * torsoHeight - halfHeight + radiusBottom);
        positions.push(radius * cosTheta);

        // normal
        vec3.normalize(temp1, vec3.set(temp2, sinTheta, -slope, cosTheta));
        normals.push(temp1.x);
        normals.push(temp1.y);
        normals.push(temp1.z);

        // uv
        uvs.push(u);
        uvs.push(v / 2 + buttonProp);

        // save index of vertex in respective row
        indexRow.push(index);

        // increase index
        ++index;
      }

      // now save positions of the row in our index array
      indexArray.push(indexRow);
    }

    // generate indices
    for (let y = 0; y < torSegments; ++y) {
      for (let x = 0; x < sides; ++x) {
        // we use the index array to access the correct indices
        let i1 = indexArray[y][x];
        let i2 = indexArray[y + 1][x];
        let i3 = indexArray[y + 1][x + 1];
        let i4 = indexArray[y][x + 1];

        // face one
        indices.push(i1);
        indices.push(i4);
        indices.push(i2);

        // face two
        indices.push(i4);
        indices.push(i3);
        indices.push(i2);
      }
    }
  }

  function generateButton() {
    for (let lat = 0; lat <= buttonSegments; ++lat) {
      let theta = lat * Math.PI / buttonSegments / 2;
      let sinTheta = Math.sin(theta);
      let cosTheta = -Math.cos(theta);

      for (let lon = 0; lon <= sides; ++lon) {
        let phi = lon * 2 * Math.PI / sides - Math.PI / 2.0;
        let sinPhi = Math.sin(phi);
        let cosPhi = Math.cos(phi);

        let x = sinPhi * sinTheta;
        let y = cosTheta;
        let z = cosPhi * sinTheta;
        let u = lon / sides;
        let v = lat / sides;

        positions.push(x * radiusBottom, y * radiusBottom, z * radiusBottom);
        normals.push(x, y, z);
        uvs.push(u, v);

        if ((lat < buttonSegments) && (lon < sides)) {
          let seg1 = sides + 1;
          let a = seg1 * lat + lon;
          let b = seg1 * (lat + 1) + lon;
          let c = seg1 * (lat + 1) + lon + 1;
          let d = seg1 * lat + lon + 1;

          indices.push(a, d, b);
          indices.push(d, c, b);
        }
        
        ++index;
      }
    }
  }

  function generateTop() {
    for (let lat = 0; lat <= topSegments; ++lat) {
      let theta = lat * Math.PI / topSegments / 2 + Math.PI / 2;
      let sinTheta = Math.sin(theta);
      let cosTheta = -Math.cos(theta);

      for (let lon = 0; lon <= sides; ++lon) {
        let phi = lon * 2 * Math.PI / sides - Math.PI / 2.0;
        let sinPhi = Math.sin(phi);
        let cosPhi = Math.cos(phi);

        let x = sinPhi * sinTheta;
        let y = cosTheta;
        let z = cosPhi * sinTheta;
        let u = lon / sides;
        let v = lat / sides + (1-topProp);

        positions.push(x * radiusBottom, y * radiusBottom + torsoHeight, z * radiusBottom);
        normals.push(x, y + 1, z);
        uvs.push(u, v);

        if ((lat < topSegments) && (lon < sides)) {
          let seg1 = sides + 1;
          let a = seg1 * lat + lon + indexArray[torSegments][sides] + 1;
          let b = seg1 * (lat + 1) + lon + indexArray[torSegments][sides] + 1;
          let c = seg1 * (lat + 1) + lon + 1 + indexArray[torSegments][sides] + 1;
          let d = seg1 * lat + lon + 1 + indexArray[torSegments][sides] + 1;

          indices.push(a, d, b);
          indices.push(d, c, b);
        }
      }
    }
  }
}
