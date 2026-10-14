function isToastInteraction(event: Event): boolean {
  return (
    event.target instanceof Element &&
    event.target.closest('[data-sonner-toaster]') !== null
  );
}

function ignoreToastInteraction<E extends Event>(
  handler?: (event: E) => void,
): (event: E) => void {
  return (event) => {
    if (isToastInteraction(event)) {
      event.preventDefault();
      return;
    }
    handler?.(event);
  };
}

function bottomOffset(base: number): string {
  return `calc(${base}px + var(${TOAST_CLEARANCE_VAR}, 0px))`;
}

function claimClearance(): () => void {
  clearanceClaims += 1;
  notifyClearance();
  return () => {
    clearanceClaims -= 1;
    notifyClearance();
  };
}

function hasClearance(): boolean {
  return clearanceClaims > 0;
}

function subscribeClearance(listener: () => void): () => void {
  clearanceListeners.add(listener);
  return () => {
    clearanceListeners.delete(listener);
  };
}

function notifyClearance(): void {
  clearanceListeners.forEach((listener) => listener());
}

let clearanceClaims = 0;
const clearanceListeners = new Set<() => void>();

export const TOAST_CLEARANCE_VAR = '--ap-toast-clearance';

export const toastInteraction = {
  isToastInteraction,
  ignore: ignoreToastInteraction,
  bottomOffset,
  claimClearance,
  hasClearance,
  subscribeClearance,
};
