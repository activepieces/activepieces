import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { ghostAuth } from '../../auth';
import { ghostClient } from '../../common/client';
import { ghostSiteOutputSchema } from '../../output-schemas';

export const ghostGetSite = createAction({
  auth: ghostAuth,
  name: 'ghost_get_site',
  outputSchema: ghostSiteOutputSchema,
  classification: 'READ',
  displayName: 'Get Site',
  description: 'Get the site title, URL and Ghost version.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns basic site information: title, description, public URL, logo, icon, accent color and Ghost version. Use it to confirm which publication the connection points at.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    const response = await ghostClient.request<{ site: Record<string, unknown> }>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/site',
    });
    return response.site;
  },
});
