import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetOrganizationOutputSchema } from '../../../output-schemas';

export const getOrganizationByUrlAction = createAction({
  auth: podioAuth,
  name: 'podio_get_organization_by_url',
  outputSchema: podioGetOrganizationOutputSchema,
  displayName: 'Get Organization by URL',
  description: 'Gets the organization that a Podio URL belongs to.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the organization that a Podio URL belongs to, such as https://company.podio.com or any page under it; use Get Organization when the id is known.',
    idempotent: true,
  },
  props: {
    url: podioAiProps.text({ required: true, displayName: 'URL', description: 'A full Podio URL in the organization, such as https://company.podio.com/intranet.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: '/org/url', query: podioUtils.query({ values: { url: propsValue.url } }) });
  },
});
