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

export const toastInteraction = {
  isToastInteraction,
  ignore: ignoreToastInteraction,
};
