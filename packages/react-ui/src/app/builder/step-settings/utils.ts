export const transformKeyWithReplacements = (
  key: string,
  numberReplacement: string,
  stringReplacement: string,
) => {
  return key
    .split('.')
    .map((part) => {
      if (part === '') {
        return ''; // Keep empty parts intact (for consecutive dots)
      } else if (!isNaN(Number(part))) {
        return numberReplacement;
      } else {
        return `${stringReplacement}${part}`;
      }
    })
    .join('.');
};
