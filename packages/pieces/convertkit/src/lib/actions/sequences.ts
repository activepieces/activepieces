import { createAction, Property } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../..';
import { CONVERTKIT_API_URL } from '../common';
import { propertyCustomFields } from './custom-fields';
import { propertyTags } from './tags';

const API_ENDPOINT = 'sequences';

export const getSequences = async (auth: string) => {
  const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}?api_secret=${auth}`;
  const response = await fetch(url);
  return await response.json();
};

export const propertySequence = Property.Dropdown({
  displayName: 'Sequence',
  required: true,
  refreshers: ['auth'],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your account',
        options: [],
      };
    }

    const sequences = await getSequences(auth.toString());

    // loop through data and map to options
    const options = sequences.courses.map(
      (field: { id: string; name: string }) => {
        return {
          label: field.name,
          value: field.id,
        };
      }
    );

    return {
      options,
    };
  },
});

export const listSequences = createAction({
  auth: convertkitAuth,
  name: 'sequences_list_sequences',
  displayName: 'Sequences: List Sequences',
  description: 'Returns a list of all sequences',
  props: {},
  async run(context) {
    return getSequences(context.auth);
  },
});

export const addSubscriberToSequence = createAction({
  auth: convertkitAuth,
  name: 'sequences_add_subscriber_to_sequence',
  displayName: 'Sequences: Add Subscriber To Sequence',
  description: 'Add a subscriber to a sequence',
  props: {
    sequenceId: propertySequence,
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
    tags: propertyTags,
    fields: propertyCustomFields,
  },
  async run(context) {
    const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}/${context.propsValue.sequenceId}/subscribe?api_secret=${context.auth}`;

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
  name: 'sequences_list_subscriptions_to_sequence',
  displayName: 'Sequences: List Subscriptions To Sequence',
  description: 'List all subscriptions to a sequence',
  props: {
    sequenceId: propertySequence,
  },
  async run(context) {
    const url = `${CONVERTKIT_API_URL}${API_ENDPOINT}/${context.propsValue.sequenceId}/subscriptions?api_secret=${context.auth}`;

    // Fetch URL using fetch api
    const response = await fetch(url);

    // Get response body
    const data = await response.json();

    // Return response body
    return data;
  },
});
