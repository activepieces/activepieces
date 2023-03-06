import { readdir } from 'node:fs/promises'

export const getAvailablePieceNames = async (): Promise<string[]> => {
  return await readdir('packages/pieces')
}
