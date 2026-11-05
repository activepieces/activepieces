import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioCreateAppOutputSchema } from '../../../output-schemas';

export const getAppByLabelsAction = createAction({
  auth: podioAuth,
  name: 'podio_get_app_by_labels',
  outputSchema: podioCreateAppOutputSchema,
  displayName: 'Get App by Labels',
  description: 'Gets an app from the URL labels of its organization, workspace and app.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads one Podio app from the three URL labels in its web address (podio.com/<org label>/<space label>/apps/<app label>), returning the same definition as Get App. Use it when you have a Podio link rather than an app id; with a space id use Get App on Space by URL Label instead.',
    idempotent: true,
  },
  props: {
    orgLabel: podioAiProps.text({ required: true, displayName: 'Organization Label', description: 'The URL label of the organization, the first path segment of a Podio link.' }),
    spaceLabel: podioAiProps.text({ required: true, displayName: 'Workspace Label', description: 'The URL label of the workspace, the second path segment of a Podio link.' }),
    appLabel: podioAiProps.text({ required: true, displayName: 'App Label', description: 'The URL label of the app, the segment after "apps/" in a Podio link.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.GET,
      path: `/app/org/${propsValue.orgLabel}/space/${propsValue.spaceLabel}/${propsValue.appLabel}`,
    });
  },
});
