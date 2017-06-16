## primitives.js

Primitives for 3D Rendering.

## Install

```bash
npm install primitives.js
```

## Usage

```javascript
let meshData = window.primitives.box(1, 1, 1, {
  widthSegments: 10,
  heightSegments: 10,
  lengthSegments: 10
});
```

## Documentation

  - Shapes
    - primitives.box(width, height, lenght, opts)
    - primitives.cone(radius, height, opts)
    - primitives.cylinder(radiusTop, radiusBottom, height, opts)
    - primitives.plane(width, length, opts)
    - primitives.quad()
    - primitives.sphere(radius, opts)
    - primitives.torus(radius, tube, opts)
  - Utils
    - primitives.wireframe(indices)
    - primitives.normals(positions, normals, length)

## License

MIT © 2017 Johnny Wu