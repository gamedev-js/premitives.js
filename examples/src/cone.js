(() => {
  return window.primitives.cone(0.5, 1, {
    radialSegments: 30,
    heightSegments: 10,
    capped: true,
  });
})();