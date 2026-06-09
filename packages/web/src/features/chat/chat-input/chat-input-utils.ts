function canSubmitMessage({
  disabled,
  textContent,
}: {
  disabled: boolean;
  textContent: string;
}): boolean {
  return !disabled && textContent.trim().length > 0;
}

export const chatInputUtils = {
  canSubmitMessage,
};
