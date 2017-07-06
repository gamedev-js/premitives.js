'use strict';

const { vec3, mat3, mat4, quat, lerp } = window.vmath;

let damping = 10.0;
let moveSpeed = 10.0;

let v3_f = vec3.new(0,0,-1);
let v3_r = vec3.new(1,0,0);
let v3_u = vec3.new(0,1,0);

let rotq = quat.create();
let rotx = quat.create();
let roty = quat.create();
let rot33 = mat3.create();
let front = vec3.create();
let right = vec3.create();
let up = vec3.create();
let front2 = vec3.create();
let right2 = vec3.create();

class Orbit {
  constructor (input, props) {
    props = props || {};
    props.theta = props.theta || 0;
    props.phi = props.phi || 0;
    props.eye = props.eye || vec3.new(0,0,0);
    props.near = props.near || 0.01;
    props.far = props.far || 1000.0;
    this._props = props;
    this._cache = {
      eye: new Float32Array(3),
      view: new Float32Array(16),
      proj: new Float32Array(16),
    };

    this._input = input;
    this._view = mat4.create();
    this._proj = mat4.create();

    this._df = 0;
    this._dr = 0;
    this._panX = 0;
    this._panY = 0;
    this._panZ = 0;

    this._curTheta = props.theta;
    this._curPhi = props.phi;

    this._curEye = vec3.clone(props.eye);
    this._theta = props.theta;
    this._phi = props.phi;
    this._eye = vec3.clone(props.eye);
  }

  tick (dt, viewportWidth, viewportHeight) {
    this._handleInput();
    this._calcView(dt);
    this._calcProj(viewportWidth, viewportHeight);
    vec3.array(this._cache.eye, this._curEye);
    mat4.array(this._cache.view, this._view);
    mat4.array(this._cache.proj, this._proj);
  }

  _handleInput () {
    let input = this._input;
    this._df = 0;
    this._dr = 0;
    this._panX = 0;
    this._panY = 0;
    this._panZ = 0;

    if ( input.mousepress('left') && input.mousepress('right') ) {
      let dx = input.mouseDeltaX;
      let dy = input.mouseDeltaY;

      this._panX = dx;
      this._panY = -dy;

    } else if ( input.mousepress('left') ) {
      let dx = input.mouseDeltaX;
      let dy = input.mouseDeltaY;

      this._theta -= dx * 0.002;
      this._panZ = -dy;

    } else if ( input.mousepress('right') ) {
      let dx = input.mouseDeltaX;
      let dy = input.mouseDeltaY;

      this._theta -= dx * 0.002;
      this._phi -= dy * 0.002;
    }

    if ( input.keypress('w') ) {
      this._df += 1;
    }
    if ( input.keypress('s') ) {
      this._df -= 1;
    }
    if ( input.keypress('a') ) {
      this._dr -= 1;
    }
    if ( input.keypress('d') ) {
      this._dr += 1;
    }

    if ( input.mouseScrollY ) {
      this._df -= input.mouseScrollY * 0.05;
    }
  }

  _calcView (dt) {
    //
    this._curPhi = lerp(this._curPhi, this._phi, dt * damping);
    this._curTheta = lerp(this._curTheta, this._theta, dt * damping);

    // phi == rot_x, theta == rot_y
    quat.identity(rotx);
    quat.identity(roty);
    quat.rotateX(rotx, rotx, this._curPhi);
    quat.rotateY(roty, roty, this._curTheta);
    quat.mul(rotq, roty, rotx);

    //
    mat3.fromQuat(rot33, rotq);

    vec3.transformMat3(front, v3_f, rot33);
    vec3.transformMat3(up, v3_u, rot33);
    vec3.transformMat3(right, v3_r, rot33);

    //
    let eye = this._eye;
    let panX = this._panX;
    let panY = this._panY;
    let panZ = this._panZ;

    if (this._df !== 0) {
      vec3.scaleAndAdd(eye, eye, front, this._df * dt * moveSpeed);
    }

    if (this._dr !== 0) {
      vec3.scaleAndAdd(eye, eye, right, this._dr * dt * moveSpeed);
    }

    if (panZ !== 0) {
      vec3.copy(front2, front);
      front2.y = 0.0;
      vec3.normalize(front2, front2);
      vec3.scaleAndAdd(eye, eye, front2, panZ * dt * moveSpeed);
    }

    if (panX !== 0) {
      vec3.copy(right2, right);
      right2.y = 0.0;
      vec3.normalize(right2, right2);
      vec3.scaleAndAdd(eye, eye, right2, panX * dt * moveSpeed);
    }

    if (panY !== 0) {
      vec3.scaleAndAdd(eye, eye, v3_u, panY * dt * moveSpeed);
    }

    vec3.lerp(this._curEye, this._curEye, eye, dt * damping);

    //
    mat4.lookAt(this._view,
      this._curEye,
      vec3.scaleAndAdd(front2, this._curEye, front, 1.0),
      up
    );
  }

  _calcProj(w, h) {
    mat4.perspective(this._proj,
      Math.PI / 4.0,
      w / h,
      this._props.near,
      this._props.far
    );
  }
}
window.Orbit = Orbit;