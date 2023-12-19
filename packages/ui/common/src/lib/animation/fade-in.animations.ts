import { animate, style, transition, trigger } from '@angular/animations';

export function fadeInAnimation(duration: number, fadeOut = true) {
  const transitions = [
    transition(':enter', [
      style({
        opacity: 0,
      }),
      animate(
        `${duration}ms  cubic-bezier(0.35, 0, 0.25, 1)`,
        style({
          opacity: 1,
        })
      ),
    ]),
  ];
  if (fadeOut) {
    transitions.push(
      transition(':leave', [
        style({
          opacity: 1,
        }),
        animate(
          `${duration}ms cubic-bezier(0.35, 0, 0.25, 1)`,
          style({
            opacity: 0,
          })
        ),
      ])
    );
  }
  return trigger(`fadeIn`, transitions);
}
export const fadeIn400ms = fadeInAnimation(400);
export const fadeIn400msWithoutOut = fadeInAnimation(400, false);
