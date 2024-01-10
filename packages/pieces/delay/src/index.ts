import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { delayForAction } from './lib/actions/delay-for-action';
import { delayUntilAction } from './lib/actions/delay-until-action';
import { delayNextDayofWeek } from './lib/actions/delay-next-day-of-week';
import { delayNextDayofYear } from './lib/actions/delay-next-day-of-year';

export const delay = createPiece({
	displayName             : 'Delay',
	minimumSupportedRelease : '0.5.0',
	logoUrl                 : 'https://cdn.activepieces.com/pieces/delay.png',
	authors                 : [ "abuaboud", "nileshtrivedi", "joeworkman" ],
	auth                    : PieceAuth.None(),
	triggers                : [],
	actions                 : [
		delayForAction    ,  // Delay for a fixed duration
		delayUntilAction  ,  // Takes a timestamp parameter instead of duration
		delayNextDayofWeek,  // Delay until next day of week
		delayNextDayofYear,  // Delay until next day of year
	],
});
