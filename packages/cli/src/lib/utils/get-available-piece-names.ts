import { readdir } from 'node:fs/promises';

export const getAvailablePieceNames = async (
  pieceType: string
): Promise<string[]> => {
  const ignoredPackages = ['framework', 'apps', 'dist', 'common'];
  const packageNames = await readdir(`packages/pieces/${pieceType}`);
  return packageNames.filter((p) => !ignoredPackages.includes(p));
};
