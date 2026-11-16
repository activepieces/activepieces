import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetSpaceByOrgAndUrlLabelOutputSchema } from '../../../output-schemas';

export const getSpaceByOrgAndUrlLabelAction = createAction({
  auth: podioAuth,
  name: 'podio_get_space_by_org_and_url_label',
  outputSchema: podioGetSpaceByOrgAndUrlLabelOutputSchema,
  displayName: 'Get Space by Organization and URL Label',
  description: 'Gets a workspace in an organization by its URL label.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads the workspace in an organization with the given URL label, such as "intranet" for https://company.podio.com/intranet. The organization id comes from List Organizations or Get Organization by URL; use Get Space when the space id is known.',
    idempotent: true,
  },
  props: {
    orgId: podioAiProps.id({ required: true, displayName: 'Organization ID', description: 'The id of the organization, from List Organizations.' }),
    urlLabel: podioAiProps.text({ required: true, displayName: 'URL Label', description: 'The URL label (slug) of the workspace, such as "intranet".' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/space/org/${propsValue.orgId}/url/${encodeURIComponent(propsValue.urlLabel)}` });
  },
});
