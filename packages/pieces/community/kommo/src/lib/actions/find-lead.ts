import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { kommoAuth } from '../auth';

export const findLeadAction = createAction({
  auth: kommoAuth,
  name: 'find_lead',
  displayName: 'Find Lead',
  description: "Finds an existing lead.",
  audience: 'both',
  aiMetadata: { description: 'Searches leads in a Kommo CRM account by a free-text query matched against the leads\' filled fields, returning all matching leads. Use to look up a lead (e.g. by name, contact info, or other field content) before referencing, updating, or reporting on it; the query is required. Read-only and idempotent.', idempotent: true },
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      required: true,
      description: 'Search query (Searches through the filled fields of the lead).'
    }),
  },
  async run(context) {
    const { subdomain, apiToken } = context.auth.props

    const result = await makeRequest(
      { apiToken, subdomain },
      HttpMethod.GET,
      `/leads?query=${encodeURIComponent(context.propsValue.query)}`
    );

    const leads = result?._embedded?.leads ?? [];

    return {
      found: leads.length > 0,
      result: leads
    };
  },
});
