// Shared, non-React state between the DOM (scroll, pointer) and the WebGL field.
// Mutated by GSAP tweens and pointer handlers, read every frame by the canvas.
export const field = {
  stage: 0, // 0 face · 1 graph · 2 shield · 3 route · 4 timeline · 5 approved
  opacity: 0.55,
  burst: 0, // 0..1 explosion pulse when the visitor approves the run
  mouse: { x: 0, y: 0, active: 0 }, // normalized device coords
  paused: false,
};

export const STAGES = ['face', 'graph', 'shield', 'route', 'timeline', 'approved'] as const;
export const RUN_STEPS = ['spec', 'tests', 'gates', 'review', 'PR', 'merge'] as const;
