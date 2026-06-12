import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';
import { simplyprintFilaments } from '../common/filaments';

export const unassignFilamentAction = createAction({
  auth: simplyprintAuth,
  name: 'unassign_filament',
  displayName: 'Unassign Filament',
  description: 'Detach a specific filament spool from whichever printer it is currently assigned to.',
  audience: 'both',
  aiMetadata: {
    description:
      'Detach a filament spool (by numeric ID or 4-char short ID) from whatever printer/slot it is currently mounted on; the backend infers the printer from the spool\'s current assignment, so you only supply the spool. Pick this to free a spool before moving or replacing it; unassigning an already-unassigned spool has no further effect, so the result state is idempotent.',
    idempotent: true,
  },
  props: {
    // Backend resolves the printer from the spool's current assignment, so
    // the user only picks the spool. `filament/Unassign` reads `fid` via
    // RequireFilament and ignores any printer id sent alongside.
    filamentId: Property.ShortText({
      displayName: 'Filament',
      description:
        'Numeric spool ID, OR the 4-character short ID (`uid`) printed on the QR sticker / NFC tag.',
      required: true,
    }),
  },
  async run(context) {
    const fid = await simplyprintFilaments.resolveFilamentId(
      context.auth,
      context.propsValue.filamentId,
    );

    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'filament/Unassign',
      queryParams: { fid: String(fid) },
    });
  },
});
