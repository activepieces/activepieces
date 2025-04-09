import { PieceAuth, createPiece } from '@activepieces/pieces-framework'
import { PieceCategory } from '@activepieces/shared'
import { calculateAverage } from './lib/actions/calculate-average'
import { calculateSum } from './lib/actions/calculate-sum'
import { countUniques } from './lib/actions/count-uniques'
import { getMinMax } from './lib/actions/get-min-max'

export const dataSummarizer = createPiece({
  displayName: 'Data Summarizer',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/data-summarizer.svg',
  authors: ['tahboubali'],
  actions: [calculateAverage, calculateSum, countUniques, getMinMax],
  triggers: [],
  categories: [PieceCategory.CORE],
})
