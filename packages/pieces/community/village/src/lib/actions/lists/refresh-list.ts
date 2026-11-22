import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const refreshList = createAction({
  auth: villageAuth,
  name: 'refresh_list',
  classification: 'WRITE',
  displayName: 'Refresh List',
  description:
    'Re-run the saved search behind a list and append new matches in the background. Only lists created from a search can be refreshed. New rows are paid with your Village credits (2 per 10 people); a 402 means none are affordable.',
  audience: 'both',
  aiMetadata: {
    description:
      'Start a background re-run of the saved search behind a search-created list (manual or imported lists cannot be refreshed), appending new matches; existing items are never removed. Spends credits for new rows (2 per 10). Optional "add" tops the list up by that many people. Not idempotent: each call can add and charge for more rows; refreshes are throttled per list (429). Poll Get List to see the result.',
    idempotent: false,
  },
  outputSchema: villageSchemas.refreshList,
  props: {
    id: Property.ShortText({
      displayName: 'List ID',
      description: 'ID of a list created from a search.',
      required: true,
    }),
    add: Property.Number({
      displayName: 'Add People',
      description: 'Optional: add this many more people instead of a plain refresh.',
      required: false,
    }),
  },
  async run(context) {
    const { id, add } = context.propsValue;
    const body: Record<string, unknown> = {};
    if (add !== undefined && add !== null) {
      const whole = Math.floor(Number(add));
      if (!Number.isFinite(whole) || whole < 1) {
        throw new Error('Add People must be a positive whole number.');
      }
      body['add'] = whole;
    }
    return villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/v2/lists/${villageApi.encodePathId(villageApi.requireText({ value: id, field: 'List ID' }))}/refresh`,
      body,
    });
  },
});
