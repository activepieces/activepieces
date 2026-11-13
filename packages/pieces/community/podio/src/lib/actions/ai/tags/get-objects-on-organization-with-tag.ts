import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetObjectsOnAppWithTagOutputSchema } from '../../../output-schemas';

export const getObjectsOnOrganizationWithTagAction = createAction({
  auth: podioAuth,
  name: 'podio_get_objects_on_organization_with_tag',
  outputSchema: podioGetObjectsOnAppWithTagOutputSchema,
  displayName: 'Get Objects On Organization With Tag',
  description: 'Lists the objects in an organization that carry a tag.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the Podio objects, such as items and statuses, in an organization that carry the given tag, most recently tagged first. Tag texts come from Get Tags On Organization. The organization id comes from List Organizations.',
    idempotent: true,
  },
  props: {
    orgId: podioAiProps.id({ required: true, displayName: 'Organization ID', description: 'The id of the organization, from List Organizations.' }),
    text: podioAiProps.text({ required: true, displayName: 'Tag', description: 'The text of the tag to look for.' }),
  },
  async run({ auth, propsValue }) {
    const body = await podioClient.request<unknown[]>({
      auth,
      method: HttpMethod.GET,
      path: `/tag/org/${propsValue.orgId}/search/`,
      query: podioUtils.query({ values: { text: propsValue.text } }),
    });
    return { objects: body, count: body.length };
  },
});
