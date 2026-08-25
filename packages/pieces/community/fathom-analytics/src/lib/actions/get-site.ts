import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { fathomAuth, FATHOM_API_BASE } from '../auth';

export const getSite = createAction({
  name: 'get_site',
  displayName: 'Get Site',
  description: 'Retrieve details for a specific site by its ID.',
  audience: 'both',
  aiMetadata: { description: 'Fetch the details of a single Fathom Analytics site by its site ID (e.g. CDBUGS). Use it when you already know the target site ID and need its metadata; call List Sites first if you only have a name. Read-only and safe to repeat.', idempotent: true },
  auth: fathomAuth,
  props: {
    site_id: Property.ShortText({
      displayName: 'Site ID',
      description: 'The unique identifier for the Fathom site (e.g., CDBUGS).',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;

    const response = await httpClient.sendRequest<{
      id: string;
      object: string;
      name: string;
      sharing: string;
      created_at: string;
    }>({
      method: HttpMethod.GET,
      url: `${FATHOM_API_BASE}/sites/${propsValue.site_id}`,
      headers: {
        Authorization: `Bearer ${auth.secret_text}`,
      },
    });

    return response.body;
  },
});
