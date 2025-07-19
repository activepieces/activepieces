import { createPiece, PieceAuth } from '@ensemble/pieces-framework';
import { calculateAverage } from './lib/actions/calculate-average';
import { calculateSum } from './lib/actions/calculate-sum';
import { countUniques } from './lib/actions/count-uniques';
import { getMinMax } from './lib/actions/get-min-max';
import { PieceCategory } from '@ensemble/shared';

export const dataSummarizer = createPiece({
  displayName: 'Data Summarizer',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.ensemble.com/pieces/data-summarizer.svg',
  authors: ['tahboubali'],
  actions: [calculateAverage, calculateSum, countUniques, getMinMax],
  triggers: [],
  categories: [PieceCategory.CORE]
});
