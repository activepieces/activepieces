import { createAction, Property } from '@activepieces/pieces-framework';
import { kickcallAuth } from '../auth';
import { kickcallClient } from '../common/client';
import { agentIdDropdown, locationIdDropdown } from '../common/props';

export const createOutboundCallAction = createAction({
  auth: kickcallAuth,
  name: 'create_outbound_call',
  displayName: 'Create Phone Call',
  description: 'Queues an outbound AI phone call through a Kickcall agent.',
  audience: 'both',
  aiMetadata: {
    description:
      'Places an outbound call from a Kickcall agent to a phone number. Use Get Call Details afterward for transcript and status. Optionally pass outbound_dynamic_variables and metadata. Each call creates a new interaction, so retries duplicate.',
    idempotent: false,
  },
  props: {
    location_id: locationIdDropdown,
    agent_id: agentIdDropdown,
    to_number: Property.ShortText({
      displayName: 'To Number',
      description: 'Destination phone number in E.164 format, e.g. +15551234567.',
      required: true,
    }),
    outbound_dynamic_variables: Property.Json({
      displayName: 'Outbound Dynamic Variables',
      description:
        'Optional JSON object of dynamic variables passed into the agent for this call, e.g. {"patient_name":"Alex"}.',
      required: false,
    }),
    metadata: Property.Object({
      displayName: 'Metadata',
      description: 'Optional key-value metadata stored with the outbound call.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = {
      location_id: propsValue.location_id,
      agent_id: propsValue.agent_id,
      to_number: propsValue.to_number,
    };
    if (
      propsValue.outbound_dynamic_variables !== undefined &&
      propsValue.outbound_dynamic_variables !== null
    ) {
      body['outbound_dynamic_variables'] = propsValue.outbound_dynamic_variables;
    }
    if (propsValue.metadata !== undefined && propsValue.metadata !== null) {
      body['metadata'] = propsValue.metadata;
    }
    return kickcallClient.marketplaceRequest({
      auth,
      path: '/api/v1/marketplace/outbound_calls',
      body,
    });
  },
});
