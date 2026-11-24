import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioResolveUrlOutputSchema } from '../../../output-schemas';

export const resolveUrlAction = createAction({
  auth: podioAuth,
  name: 'podio_resolve_url',
  outputSchema: podioResolveUrlOutputSchema,
  displayName: 'Resolve URL',
  description: 'Finds the Podio object (item, task, app, space, file, status or user) behind a Podio URL.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Turns a Podio web URL into the object it points at, with its type and id, so a link a user pasted can be passed to other actions. Supports item, task, file and status permalinks, app, space, user profile and app market URLs; fails with not found or access denied otherwise.',
    idempotent: true,
  },
  props: {
    url: podioAiProps.text({ required: true, displayName: 'URL', description: 'The Podio URL to resolve, e.g. https://podio.com/org/space/apps/app/items/1.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/reference/resolve`, query: { url: propsValue.url } });
  },
});
