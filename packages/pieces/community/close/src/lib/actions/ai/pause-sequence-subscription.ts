import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { closeAuth } from '../../auth';
import { closeClient } from '../../common/client';
import { sequenceSubscriptionShape } from './subscribe-contact-to-sequence';

export const pauseSequenceSubscription = createAction({
  auth: closeAuth,
  name: 'pause_sequence_subscription',
  classification: 'WRITE',
  displayName: 'Pause Sequence Subscription',
  description: 'Pause a contact sequence subscription.',
  audience: 'ai',
  aiMetadata: {
    description: 'Pauses one Close sequence subscription (sub_..., from List Sequence Subscriptions or Subscribe Contact to Sequence) so no further sequence steps run for that contact. Works on every Close plan. Returns the updated subscription with status paused. Pausing an already paused subscription leaves it paused.',
    idempotent: true,
  },
  outputSchema: { fields: sequenceSubscriptionShape.fields },
  props: {
    subscriptionId: Property.ShortText({ displayName: 'Subscription ID', required: true }),
  },
  async run({ auth, propsValue }) {
    const id = closeClient.closeId({ value: propsValue.subscriptionId, label: 'Subscription ID', prefix: 'sub' });
    const raw = await closeClient.request({
      auth,
      method: HttpMethod.PUT,
      path: `/sequence_subscription/${closeClient.pathId(id)}/`,
      body: { status: 'paused' },
    });
    return sequenceSubscriptionShape.map(raw);
  },
});
