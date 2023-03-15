import { readdir } from 'node:fs/promises'

export const getAvailablePieceNames = async (): Promise<string[]> => {
  const frameworkPackages = ['framework', 'apps']
  const packageNames = await readdir('packages/pieces')
  return packageNames.filter(p => !frameworkPackages.includes(p))
}
