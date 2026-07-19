// Shared timing for the "open step settings" choreography so the chat pop-out,
// the settings sidebar slide, the preview-card exit, and the flow re-center all
// move on one timeline and read as a single motion. An ease-in-out curve (zero
// velocity at both ends) keeps the morph smooth — no initial snap — over a
// duration long enough to feel gentle rather than abrupt. JS animations (WAAPI,
// rAF viewport tween) read these directly; Tailwind `duration-[450ms]` /
// `ease-[cubic-bezier(0.65,0,0.35,1)]` classes mirror them.
export const STAGE_TRANSITION_MS = 450;
export const STAGE_TRANSITION_EASING = 'cubic-bezier(0.65, 0, 0.35, 1)';

// JS equivalent of STAGE_TRANSITION_EASING (easeInOutCubic), for hand-rolled rAF
// tweens (e.g. the flow viewport settle) that must share the exact curve the
// CSS/WAAPI animations use so everything reads as one motion.
export const easeStageTransition = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
