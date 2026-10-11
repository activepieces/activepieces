// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';

import { toastInteraction } from '@/lib/toast-interaction';

function pointerDownOn(target: Element): Event {
  const event = new Event('pointerdown', { cancelable: true });
  Object.defineProperty(event, 'target', { value: target });
  return event;
}

function mountToaster() {
  const toaster = document.createElement('ol');
  toaster.setAttribute('data-sonner-toaster', '');
  const undo = document.createElement('button');
  toaster.appendChild(undo);
  const outside = document.createElement('div');
  document.body.append(toaster, outside);
  return { toaster, undo, outside };
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('toastInteraction', () => {
  it('is true only for clicks inside the toaster', () => {
    const { undo, outside } = mountToaster();
    expect(toastInteraction.isToastInteraction(pointerDownOn(undo))).toBe(true);
    expect(toastInteraction.isToastInteraction(pointerDownOn(outside))).toBe(
      false,
    );
  });

  it('swallows toaster clicks and passes every other click on', () => {
    const { undo, outside } = mountToaster();
    const handler = vi.fn();
    const guarded = toastInteraction.ignore(handler);

    const toastEvent = pointerDownOn(undo);
    guarded(toastEvent);
    expect(toastEvent.defaultPrevented).toBe(true);
    expect(handler).not.toHaveBeenCalled();

    const outsideEvent = pointerDownOn(outside);
    guarded(outsideEvent);
    expect(outsideEvent.defaultPrevented).toBe(false);
    expect(handler).toHaveBeenCalledWith(outsideEvent);
  });
});
