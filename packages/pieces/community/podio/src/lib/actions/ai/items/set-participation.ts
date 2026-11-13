import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

const PARTICIPATION_STATUSES = ['invited', 'accepted', 'declined', 'tentative'];

export const setParticipationAction = createAction({
  auth: podioAuth,
  name: 'podio_set_participation',
  displayName: 'Set Participation',
  description: 'Sets the connected user\'s RSVP on a meeting item.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets the connected user\'s participation status on a meeting item to invited, accepted, declined or tentative. The item id comes from Filter Items or Get Item.',
    idempotent: true,
  },
  props: {
    itemId: podioAiProps.id({ required: true, displayName: 'Item ID', description: 'The id of the meeting item, from Filter Items or Get Item.' }),
    status: podioAiProps.choice({ required: true, displayName: 'Status', description: 'The connected user\'s new participation status.', values: PARTICIPATION_STATUSES }),
  },
  async run({ auth, propsValue }) {
    if (!PARTICIPATION_STATUSES.includes(propsValue.status)) {
      throw new Error(`Status must be one of: ${PARTICIPATION_STATUSES.join(', ')}.`);
    }
    return await podioClient.request<unknown>({
      auth,
      method: HttpMethod.PUT,
      path: `/item/${propsValue.itemId}/participation`,
      body: { status: propsValue.status },
    });
  },
});
