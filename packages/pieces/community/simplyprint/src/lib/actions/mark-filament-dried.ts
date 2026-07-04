import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';
import { simplyprintFilaments } from '../common/filaments';

export const markFilamentDriedAction = createAction({
  auth: simplyprintAuth,
  name: 'mark_filament_dried',
  displayName: 'Mark Filament as Dried',
  description: 'Record that one or more spools were just dried. Updates each spool\'s last-dried timestamp.',
  audience: 'both',
  aiMetadata: {
    description:
      'Record a drying event for one or more spools (by numeric ID or 4-char short ID), setting each spool\'s last-dried timestamp to the given time or now. Pick this after running spools through a dryer to keep moisture tracking current; it overwrites the last-dried timestamp, so re-running it advances the recorded time rather than stacking.',
    idempotent: false,
  },
  props: {
    filamentIds: Property.Array({
      displayName: 'Filaments',
      description:
        'Spool IDs (numeric) or 4-character short IDs (uid) — comma-separated short IDs are resolved one-by-one. Pure numeric values skip the lookup round-trip.',
      required: true,
    }),
    driedAt: Property.ShortText({
      displayName: 'Dried at (ISO 8601)',
      description: 'When drying completed. Defaults to now if omitted (e.g. `2026-04-26T12:34:00Z`).',
      required: false,
    }),
  },
  async run(context) {
    const inputs = (context.propsValue.filamentIds ?? []) as Array<string | number>;
    if (inputs.length === 0) throw new Error('Provide at least one filament ID.');

    // Resolve every entry — short IDs become numeric ids; numeric inputs pass through.
    const ids = await Promise.all(
      inputs.map((i) => simplyprintFilaments.resolveFilamentId(context.auth, i)),
    );

    // RequireFilaments() reads `fid` from $this->GET by default (the in-PHP
    // comment on this endpoint claiming "ids in POST" is misleading — the
    // call passes default args, so it's GET["fid"]). Bulk is supported via
    // CSV in the same query param.
    const body: Record<string, unknown> = {};
    if (context.propsValue.driedAt) body['dried_at'] = context.propsValue.driedAt;

    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'filament/MarkDried',
      queryParams: { fid: ids.join(',') },
      body,
    });
  },
});
