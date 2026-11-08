import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioCreateAppOutputSchema } from '../../../output-schemas';

export const getAppOnSpaceByUrlLabelAction = createAction({
  auth: podioAuth,
  name: 'podio_get_app_on_space_by_url_label',
  outputSchema: podioCreateAppOutputSchema,
  displayName: 'Get App on Space by URL Label',
  description: 'Gets the app with a given URL label in a workspace.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads one Podio app by its URL label (the segment after "apps/" in its link) within a known workspace, returning its configuration and fields. Without a space id use Get App by Labels. The space id comes from List Organizations or Get Space.',
    idempotent: true,
  },
  props: {
    spaceId: podioAiProps.id({ required: true, displayName: 'Space ID', description: 'The id of the workspace that holds the app.' }),
    urlLabel: podioAiProps.text({ required: true, displayName: 'URL Label', description: 'The URL label of the app, the segment after "apps/" in its Podio link.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/app/space/${propsValue.spaceId}/${propsValue.urlLabel}` });
  },
});
