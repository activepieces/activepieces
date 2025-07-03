import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { addSubtractDateAction } from './lib/actions/add-subtract-date';
import { dateDifferenceAction } from './lib/actions/date-difference';
import { extractDateParts } from './lib/actions/extract-date-parts';
import { formatDateAction } from './lib/actions/format-date';
import { getCurrentDate } from './lib/actions/get-current-date';
import { nextDayofWeek } from './lib/actions/next-day-of-week';
import { nextDayofYear } from './lib/actions/next-day-of-year';

const description = `Manipulate, format, and extract time units for all your date and time needs.`;

export const utilityDate = createPiece({
  displayName: 'Date Helper',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.36.1',
  categories: [PieceCategory.CORE],
  logoUrl: 'https://cdn.activepieces.com/pieces/calendar_piece.svg',
  authors: ["joeworkman","kishanprmr","MoShizzle","abuaboud"],
  actions: [
    getCurrentDate,
    formatDateAction,
    extractDateParts,
    dateDifferenceAction,
    addSubtractDateAction,
    nextDayofWeek,
    nextDayofYear,
  ],
  triggers: [],
  description: description,
});
