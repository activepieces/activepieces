import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';
import { simplyprintFilaments } from '../common/filaments';

export const adjustFilamentWeightAction = createAction({
  auth: simplyprintAuth,
  name: 'adjust_filament_weight',
  displayName: 'Adjust Filament Weight',
  description:
    'Update the remaining filament on a spool. Provide ONE of "grams remaining" / "percent remaining" / "weighed gross" — the other two derive from it.',
  props: {
    filamentId: Property.ShortText({
      displayName: 'Filament',
      description: 'Numeric spool ID, OR the 4-character short ID (`uid`) printed on the QR sticker / NFC tag.',
      required: true,
    }),
    gramsRemaining: Property.Number({
      displayName: 'Grams remaining',
      description: 'Net grams of filament left on the spool.',
      required: false,
    }),
    percentRemaining: Property.Number({
      displayName: 'Percent remaining (0-100)',
      description: 'Alternative to grams — share of the spool still on the reel.',
      required: false,
    }),
    weighedGross: Property.Number({
      displayName: 'Weighed gross (grams)',
      description: 'Total weight including the empty spool. Combine with "subtract empty spool" to compute net.',
      required: false,
    }),
    emptySpoolWeight: Property.Number({
      displayName: 'Empty spool weight (g)',
      description: 'Override the empty spool weight used for the gross calculation.',
      required: false,
    }),
    subtractEmptySpool: Property.Checkbox({
      displayName: 'Subtract empty spool from gross',
      required: false,
      defaultValue: true,
    }),
    saveEmptySpoolWeight: Property.Checkbox({
      displayName: 'Persist empty spool weight on spool record',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const fid = await simplyprintFilaments.resolveFilamentId(context.auth, context.propsValue.filamentId);
    const v = context.propsValue;

    const body: Record<string, unknown> = {};
    if (typeof v.gramsRemaining === 'number') body['grams_remaining'] = v.gramsRemaining;
    if (typeof v.percentRemaining === 'number') body['percent_left'] = v.percentRemaining;
    if (typeof v.weighedGross === 'number') body['weighed_gross'] = v.weighedGross;
    if (typeof v.emptySpoolWeight === 'number') body['empty_spool_weight'] = v.emptySpoolWeight;
    if (typeof v.subtractEmptySpool === 'boolean') body['subtract_empty_spool'] = v.subtractEmptySpool;
    if (typeof v.saveEmptySpoolWeight === 'boolean') body['save_empty_spool_weight'] = v.saveEmptySpoolWeight;

    if (Object.keys(body).length === 0) {
      throw new Error('Provide at least one of "grams remaining", "percent remaining", or "weighed gross".');
    }

    // RequireFilament reads `fid` from $this->GET (default).
    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'filament/AdjustWeight',
      queryParams: { fid: String(fid) },
      body,
    });
  },
});
