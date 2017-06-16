(() => {
  return window.primitives.cylinder(0.5, 0.5, 1, {
    radialSegments: 30,
    heightSegments: 10,
    capped: true,
  });
})();