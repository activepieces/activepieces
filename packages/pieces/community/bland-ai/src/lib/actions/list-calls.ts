import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { blandAiAuth } from '../auth';
import { blandApiCall } from '../common/client';

export const listCalls = createAction({
  auth: blandAiAuth,
  name: 'list_calls',
  displayName: 'List Calls',
  description: 'Retrieve a list of recent AI calls with optional filters.',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of calls to return (1–100, default 100).',
      required: false,
      defaultValue: 100,
    }),
    fromNumber: Property.ShortText({
      displayName: 'From Number',
      description: 'Filter by the originating phone number.',
      required: false,
    }),
    toNumber: Property.ShortText({
      displayName: 'To Number',
      description: 'Filter by the destination phone number.',
      required: false,
    }),
    completed: Property.Checkbox({
      displayName: 'Completed Only',
      description: 'When enabled, only return completed calls.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { limit, fromNumber, toNumber, completed } = context.propsValue;

    const rawLimit = limit ?? 100;
    const clampedLimit = Math.max(1, Math.min(100, rawLimit));

    const query: Record<string, string | undefined> = {
      limit: String(clampedLimit),
      from: fromNumber || undefined,
      to: toNumber || undefined,
    };

    if (completed) {
      query['completed'] = 'true';
    }

    return blandApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/calls',
      query,
    });
  },
});
