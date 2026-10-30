import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { dripAuth } from '../auth';
import { dripApi } from '../common/client';
import { dripProps } from '../common/props';
import { dripOutputSchemas } from '../output-schemas';

const MAX_ACTION_LENGTH = 255;

export const recordEventAction = createAction({
  auth: dripAuth,
  name: 'record_event',
  displayName: 'Record Custom Event',
  description: 'Records a custom event (such as "Logged in") for a subscriber. Workflows and rules listening for it may run.',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Records a custom event (an action name such as "Viewed pricing" plus optional properties) for a Drip subscriber by email or subscriber ID; an unknown email creates the subscriber. Drip workflows and rules listening for that action may run and send emails. Not idempotent: each call records another event.',
    idempotent: false,
  },
  props: {
    accountId: dripProps.accountId(),
    subscriber: dripProps.subscriber(),
    action: Property.ShortText({ displayName: 'Event Action', description: 'The event name, e.g. Logged in. Reuse names from List Custom Event Names.', required: true }),
    properties: Property.Object({
      displayName: 'Properties',
      description: 'Optional event properties. For a conversion, add "value" in cents.',
      required: false,
    }),
    occurredAt: Property.DateTime({ displayName: 'Occurred At', description: 'When the event happened (ISO-8601). Defaults to now.', required: false }),
  },
  outputSchema: dripOutputSchemas.recordEvent,
  async run({ auth, propsValue }) {
    const token = auth.secret_text;
    const identity = dripApi.identify({ value: propsValue.subscriber, label: 'Subscriber Email or ID' });
    const action = dripApi.requireText({ value: propsValue.action, label: 'Event Action' });
    if (action.length > MAX_ACTION_LENGTH) {
      throw new Error(`Event Action must be at most ${MAX_ACTION_LENGTH} characters.`);
    }
    const occurredAt = dripApi.parseIsoDate({ value: propsValue.occurredAt, label: 'Occurred At' });
    const properties = dripApi.parseObject({ value: propsValue.properties, label: 'Properties' });
    const accountId = await dripApi.resolveAccountId({ token, accountId: propsValue.accountId });
    await dripApi.request<unknown>({
      token,
      method: HttpMethod.POST,
      path: `${dripApi.accountPath(accountId)}/events`,
      operation: 'record event',
      body: { events: [{ ...identity, ...dripApi.compact({ action, properties, occurred_at: occurredAt }) }] },
    });
    return { subscriber: dripApi.requireText({ value: propsValue.subscriber, label: 'Subscriber' }), action, occurredAt: occurredAt ?? null, recorded: true };
  },
});
