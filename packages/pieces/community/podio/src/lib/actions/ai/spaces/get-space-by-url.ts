import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioUtils } from '../../../common/utils';
import { podioGetSpaceOutputSchema } from '../../../output-schemas';

export const getSpaceByUrlAction = createAction({
  auth: podioAuth,
  name: 'podio_get_space_by_url',
  outputSchema: podioGetSpaceOutputSchema,
  displayName: 'Get Space by URL',
  description: 'Gets a workspace and its organization from a Podio URL or slugs.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads a workspace and its organization from a full Podio URL (any page inside the workspace works), or from the organization and workspace slugs together. Use Get Space when the space id is known.',
    idempotent: true,
  },
  props: {
    url: podioAiProps.text({ required: false, displayName: 'URL', description: 'A full Podio URL in the workspace, such as https://company.podio.com/intranet. Required unless both slugs are set.' }),
    orgSlug: podioAiProps.text({ required: false, displayName: 'Organization Slug', description: 'The organization slug, such as "company". Used together with Space Slug instead of URL.' }),
    spaceSlug: podioAiProps.text({ required: false, displayName: 'Space Slug', description: 'The workspace slug, such as "intranet". Used together with Organization Slug instead of URL.' }),
  },
  async run({ auth, propsValue }) {
    if (!propsValue.url && !(propsValue.orgSlug && propsValue.spaceSlug)) {
      throw new Error('Set url, or both orgSlug and spaceSlug.');
    }
    const query = podioUtils.query({ values: { url: propsValue.url, org_slug: propsValue.orgSlug, space_slug: propsValue.spaceSlug } });
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: '/space/url', query });
  },
});
