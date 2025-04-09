import { PieceAuth, createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { changeFileEncoding } from './lib/actions/change-file-encoding'
import { checkFileType } from './lib/actions/check-file-type'
import { createFile } from './lib/actions/create-file'
import { readFileAction } from './lib/actions/read-file'

export const filesHelper = createPiece({
  displayName: 'Files Helper',
  description: 'Read file content and return it in different formats.',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/file-piece.svg',
  categories: [PieceCategory.CORE],
  authors: ['kishanprmr', 'MoShizzle', 'abuaboud', 'Seb-C'],
  actions: [readFileAction, createFile, changeFileEncoding, checkFileType],
  triggers: [],
})
