function toStringArray(value: unknown[], fieldLabel: string): string[] {
  return value.map((item, index) => {
    if (typeof item !== 'string' || item.trim() === '') {
      throw new Error(
        `${fieldLabel} contains an invalid entry at position ${
          index + 1
        }: expected a non-empty string.`
      );
    }
    return item;
  });
}

export const gmailValidation = {
  toStringArray,
};
