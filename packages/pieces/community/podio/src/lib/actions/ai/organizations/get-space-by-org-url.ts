import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetSpaceByOrgAndUrlLabelOutputSchema } from '../../../output-schemas';

export const getSpaceByOrgUrlAction = createAction({
  auth: podioAuth,
  name: 'podio_get_space_by_org_url',
  outputSchema: podioGetSpaceByOrgAndUrlLabelOutputSchema,
  displayName: 'Get Space by Organization URL',
  description: 'Gets a workspace in an organization by its URL label.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the workspace in an organization whose URL label matches, such as "intranet" for https://company.podio.com/intranet. The organization id comes from List Organizations or Get Organization by URL; use Get Space when the space id is known.',
    idempotent: true,
  },
  props: {
    orgId: podioAiProps.id({ required: true, displayName: 'Organization ID', description: 'The id of the organization, from List Organizations.' }),
    url: podioAiProps.text({ required: true, displayName: 'Space URL Label', description: 'The URL label of the workspace, such as "intranet".' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/org/${propsValue.orgId}/space/url/${encodeURIComponent(propsValue.url)}` });
  },
});
