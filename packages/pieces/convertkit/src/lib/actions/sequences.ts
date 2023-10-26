import { createAction, Property } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../..';
import { CONVERTKIT_API_URL } from '../common';

const API_ENDPOINT = 'sequences/';

export const listSequences = createAction({
  auth: convertkitAuth,
  name: 'list_sequences',
  displayName: 'Sequences: List Sequences',
  description: 'Returns a list of all sequences',
  props: {},
  async run(context) {
    const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}?api_secret=${context.auth}`;

    // Fetch URL using fetch api
    const response = await fetch(url);

    // Get response body
    const data = await response.json();

    // Return response body
    return data;
  },
});

export const addSubscriberToSequence = createAction({
  auth: convertkitAuth,
  name: 'add_subscriber_to_sequence',
  displayName: 'Sequences: Add Subscriber To Sequence',
  description: 'Add a subscriber to a sequence',
  props: {
    sequenceId: Property.ShortText({
      displayName: 'Sequence Id',
      description: 'The sequence id',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'The email of the subscriber',
      required: true,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'The first name of the subscriber',
      required: false,
    }),
    fields: Property.Object({
      displayName: 'Fields',
      description: 'The custom fields',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'The tags',
      required: false,
    }),
  },
  async run(context) {
    const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}${context.propsValue.sequenceId}/subscribe?api_secret=${context.auth}`;

    // Fetch URL using fetch api
    const response = await fetch(url, {
      method: 'POST',
      body: JSON.stringify({ ...context.propsValue }),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Get response body
    const data = await response.json();

    // Return response body
    return data;
  },
});

export const listSupscriptionsToSequence = createAction({
  auth: convertkitAuth,
  name: 'list_subscriptions_to_sequence',
  displayName: 'Sequences: List Subscriptions To Sequence',
  description: 'List all subscriptions to a sequence',
  props: {
    sequenceId: Property.ShortText({
      displayName: 'Sequence Id',
      description: 'The sequence id',
      required: true,
    }),
  },
  async run(context) {
    const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}${context.propsValue.sequenceId}/subscriptions?api_secret=${context.auth}`;

    // Fetch URL using fetch api
    const response = await fetch(url);

    // Get response body
    const data = await response.json();

    // Return response body
    return data;
  },
});
