import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { blandAiAuth } from '../auth';
import { blandApiCall } from '../common/client';

export const listCalls = createAction({
  auth: blandAiAuth,
  name: 'list_calls',
  displayName: 'List Calls',
  description: 'List recent Bland AI calls with optional filters.',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of calls to return.',
      required: false,
      defaultValue: 10,
    }),
    fromNumber: Property.ShortText({
      displayName: 'From Number',
      description: 'Optional origin phone number filter.',
      required: false,
    }),
    toNumber: Property.ShortText({
      displayName: 'To Number',
      description: 'Optional destination phone number filter.',
      required: false,
    }),
  },
  async run(context) {
    const { limit, fromNumber, toNumber } = context.propsValue;
    const safeLimit = Math.max(1, Math.min(100, limit ?? 10));
    const query: Record<string, string> = {
      limit: String(safeLimit),
      ...(fromNumber ? { from_number: fromNumber } : {}),
      ...(toNumber ? { to_number: toNumber } : {}),
    };

    return blandApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/calls',
      query,
    });
  },
});
