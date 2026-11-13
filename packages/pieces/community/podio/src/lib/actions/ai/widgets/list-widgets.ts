import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioListWidgetsOutputSchema } from '../../../output-schemas';

export const listWidgetsAction = createAction({
  auth: podioAuth,
  name: 'podio_list_widgets',
  outputSchema: podioListWidgetsOutputSchema,
  displayName: 'List Widgets',
  description: 'Lists the widgets on an organization, space, app or user, with their current data.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists every Podio widget on an organization, space, app or user in display order, with its current data and the widget ids the other widget actions take.',
    idempotent: true,
  },
  props: {
    refType: podioAiProps.choice({
      required: true,
      displayName: 'Reference Type',
      description: 'Where the widgets live: "org", "space", "app" or "user".',
      values: ['org', 'space', 'app', 'user'],
    }),
    refId: podioAiProps.id({
      required: true,
      displayName: 'Reference ID',
      description: 'The id of the organization, space, app or user, from List Organizations, Get Space, List Apps or Get User.',
    }),
  },
  async run({ auth, propsValue }) {
    const body = await podioClient.request<unknown[]>({ auth, method: HttpMethod.GET, path: `/widget/${propsValue.refType}/${propsValue.refId}` });
    return { widgets: body, count: body.length };
  },
});
