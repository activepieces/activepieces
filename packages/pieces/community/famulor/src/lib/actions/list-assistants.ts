import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { famulorAuth } from '../common/auth';
import { famulorRequest, flattenAssistant, unwrapList, unwrapTotal } from '../common/client';

export const listAssistants = createAction({
  auth: famulorAuth,
  name: 'listAssistants',
  displayName: 'List Assistants',
  description: 'List AI phone assistants in the workspace.',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'List AI phone assistants in the Famulor workspace. Use this to discover assistant UUIDs before placing a call or creating a campaign. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of assistants to return (1–200, default 50)',
      required: false,
      defaultValue: 50,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of assistants to skip for pagination',
      required: false,
      defaultValue: 0,
    }),
  },
  async run({ auth, propsValue }) {
    const queryParams: Record<string, string> = {};
    if (propsValue.limit !== undefined && propsValue.limit !== null) {
      queryParams['limit'] = String(propsValue.limit);
    }
    if (propsValue.offset !== undefined && propsValue.offset !== null) {
      queryParams['offset'] = String(propsValue.offset);
    }

    const body = await famulorRequest({
      auth,
      method: HttpMethod.GET,
      path: '/assistants',
      queryParams,
    });

    const rows = unwrapList(body, ['assistants', 'data', 'rows']).map((assistant) =>
      flattenAssistant(assistant),
    );
    return {
      total: unwrapTotal(body) ?? rows.length,
      rows,
    };
  },
});
