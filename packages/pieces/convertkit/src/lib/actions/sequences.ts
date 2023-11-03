import { createAction } from '@activepieces/pieces-framework';
import { convertkitAuth } from '../..';
import {
  API_ENDPOINT,
  fetchSequences,
  sequenceIdChoice,
  firstName,
  email,
} from '../common/sequences';
import { allFields } from '../common/custom-fields';
import { tags } from '../common//tags';
import { CONVERTKIT_API_URL } from '../common/constants';

export const listSequences = createAction({
  auth: convertkitAuth,
  name: 'sequences_list_sequences',
  displayName: 'Sequences: List Sequences',
  description: 'Returns a list of all sequences',
  props: {},
  async run(context) {
    const data = await fetchSequences(context.auth);
    // if courses exist, return courses
    if (data.courses) {
      return data.courses;
    }
    return data;
  },
});

export const addSubscriberToSequence = createAction({
  auth: convertkitAuth,
  name: 'sequences_add_subscriber_to_sequence',
  displayName: 'Sequences: Add Subscriber To Sequence',
  description: 'Add a subscriber to a sequence',
  props: {
    sequenceId: sequenceIdChoice,
    email,
    firstName,
    tags,
    fields: allFields,
  },
  async run(context) {
    const { sequenceId, email, firstName, tags, fields } = context.propsValue;
    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}/${context.propsValue.sequenceId}/subscribe?api_secret=${context.auth}`;

    const body = JSON.stringify({ email, first_name: firstName, tags, fields });

    // Fetch URL using fetch api
    const response = await fetch(url, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { success: false, message: 'Error adding subscriber to sequence' };
    }

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
    sequenceId: sequenceIdChoice,
  },
  async run(context) {
    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}/${context.propsValue.sequenceId}/subscriptions?api_secret=${context.auth}`;

    // Fetch URL using fetch api
    const response = await fetch(url);

    if (!response.ok) {
      return {
        success: false,
        message: 'Error listing subscriptions to sequence',
      };
    }

    // Get response body
    const data = await response.json();

    // Return response body
    return data;
  },
});
