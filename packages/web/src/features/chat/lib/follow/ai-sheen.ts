import { pageFocus } from './page-focus';

function play(elements: Element[]): boolean {
  const hosts = elements.filter(
    (element): element is HTMLElement =>
      element instanceof HTMLElement && element.getClientRects().length > 0,
  );
  if (hosts.length === 0) return false;
  pending.push(hosts);
  if (frame === 0) frame = requestAnimationFrame(flush);
  return true;
}

function durationFor(width: number): number {
  const travel = ((width + BAND_PX) / SPEED_PX_PER_S) * 1000;
  return Math.round(Math.min(MAX_MS, Math.max(MIN_MS, travel)));
}

function delaysByTop(tops: number[]): number[] {
  const rows = [...new Set(tops.map(Math.round))].sort((a, b) => a - b);
  return tops.map((top) => rows.indexOf(Math.round(top)) * STAGGER_MS);
}

function flush(): void {
  frame = 0;
  const batch = pending.splice(0).map(measure);
  const delays = delaysByTop(batch.map((group) => group.top));
  const reduced = pageFocus.prefersReducedMotion();
  batch.forEach((group, index) =>
    group.hosts.forEach(({ host, offset }) =>
      sweep({
        host,
        offset,
        width: group.width,
        delay: delays[index],
        reduced,
      }),
    ),
  );
}

function measure(hosts: HTMLElement[]): MeasuredGroup {
  const rects = hosts.map((host) => host.getBoundingClientRect());
  const left = Math.min(...rects.map((rect) => rect.left));
  const right = Math.max(...rects.map((rect) => rect.right));
  return {
    top: Math.min(...rects.map((rect) => rect.top)),
    width: Math.max(0, right - left),
    hosts: hosts.map((host, index) => ({
      host,
      offset: rects[index].left - left,
    })),
  };
}

function sweep({
  host,
  offset,
  width,
  delay,
  reduced,
}: {
  host: HTMLElement;
  offset: number;
  width: number;
  delay: number;
  reduced: boolean;
}): void {
  host.querySelector(`:scope > .${OVERLAY_CLASS}`)?.remove();
  const overlay = document.createElement('span');
  overlay.className = OVERLAY_CLASS;
  overlay.setAttribute('aria-hidden', 'true');
  const base = document.createElement('span');
  base.className = 'ap-ai-sheen-base';
  overlay.append(base);
  host.append(overlay);
  const duration = durationFor(width);
  const animations = reduced
    ? [
        base.animate([{ opacity: 1 }, { opacity: 0 }], {
          duration: REDUCED_FADE_MS,
          delay,
          easing: 'ease-out',
          fill: 'both',
        }),
      ]
    : [
        base.animate(
          [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 0 }],
          {
            duration: duration + BASE_TAIL_MS,
            delay,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            fill: 'both',
          },
        ),
        bandOf(overlay).animate(
          [
            { transform: `translateX(${-BAND_PX - offset}px) skewX(-14deg)` },
            { transform: `translateX(${width - offset}px) skewX(-14deg)` },
          ],
          {
            duration,
            delay,
            easing: 'cubic-bezier(0.4, 0, 0.25, 1)',
            fill: 'both',
          },
        ),
      ];
  let running = animations.length;
  const settle = () => {
    running -= 1;
    if (running > 0) return;
    overlay.remove();
  };
  animations.forEach((animation) => {
    animation.onfinish = settle;
    animation.oncancel = settle;
  });
}

function bandOf(overlay: HTMLElement): HTMLElement {
  const band = document.createElement('span');
  band.className = 'ap-ai-sheen-band';
  band.style.width = `${BAND_PX}px`;
  overlay.append(band);
  return band;
}

const OVERLAY_CLASS = 'ap-ai-sheen';
const BAND_PX = 140;
const SPEED_PX_PER_S = 1000;
const MIN_MS = 420;
const MAX_MS = 900;
const BASE_TAIL_MS = 150;
const STAGGER_MS = 40;
const REDUCED_FADE_MS = 600;
const pending: HTMLElement[][] = [];
let frame = 0;

export const aiSheen = {
  play,
};

type MeasuredGroup = {
  top: number;
  width: number;
  hosts: { host: HTMLElement; offset: number }[];
};
