import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioApi } from '../../../common/api';
import { podioGetStatusOutputSchema } from '../../../output-schemas';

export const getStatusAction = createAction({
  auth: podioAuth,
  name: 'podio_get_status',
  outputSchema: podioGetStatusOutputSchema,
  displayName: 'Get Status',
  description: 'Gets one status message by its id.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads one Podio status message with its text, author, comments, tasks, files, likes and poll. The status id comes from Create Status or a stream action such as Get Space Stream.',
    idempotent: true,
  },
  props: {
    statusId: podioAiProps.id({ required: true, displayName: 'Status ID', description: 'The id of the status message.' }),
  },
  async run({ auth, propsValue }) {
    return await podioApi.getStatus({ auth, statusId: propsValue.statusId });
  },
});
