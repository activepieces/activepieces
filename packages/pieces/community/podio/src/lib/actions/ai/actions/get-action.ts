import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetActionOutputSchema } from '../../../output-schemas';

export const getActionAction = createAction({
  auth: podioAuth,
  name: 'podio_get_action',
  outputSchema: podioGetActionOutputSchema,
  displayName: 'Get Action',
  description: 'Gets one stream action, such as an app install or a workspace creation.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads one Podio action: a system event shown in a stream, such as a user installing an app or creating a workspace, with its text, data and comments. The action id comes from the stream actions (Get Global Stream, Get Space Stream and the other stream actions).',
    idempotent: true,
  },
  props: {
    actionId: podioAiProps.id({ required: true, displayName: 'Action ID', description: 'The id of the action, from a stream event of type "action".' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/action/${propsValue.actionId}` });
  },
});
