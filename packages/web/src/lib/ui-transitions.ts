// Shared timing for the step-settings choreography (chat pop-out, sidebar slide,
// card exit, flow re-center) so they move as one. Tailwind `duration-[450ms]` /
// `ease-[cubic-bezier(0.65,0,0.35,1)]` classes mirror these.
export const STAGE_TRANSITION_MS = 450;
export const STAGE_TRANSITION_EASING = 'cubic-bezier(0.65, 0, 0.35, 1)';

// easeInOutCubic — JS equivalent of STAGE_TRANSITION_EASING for rAF tweens.
export const easeStageTransition = (t: number): number =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
