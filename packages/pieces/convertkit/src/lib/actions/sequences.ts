import { createAction } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { Sequence } from '../common/models';
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
    return fetchSequences(context.auth);
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
    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}/${sequenceId}/subscribe`;

    const body = {
      api_secret: context.auth,
      email,
      first_name: firstName,
      tags,
      fields,
    };

    const request: HttpRequest = {
      url,
      method: HttpMethod.POST,
      body,
    };

    const response = await httpClient.sendRequest<{
      subscription: Sequence;
    }>(request);

    if (response.status !== 200) {
      throw new Error(
        `Error adding subscriber to sequence: ${response.status}`
      );
    }
    return response.body.subscription;
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
    const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}/${context.propsValue.sequenceId}/subscriptions`;

    const body = {
      api_secret: context.auth,
    };

    const request: HttpRequest = {
      url,
      method: HttpMethod.GET,
      body,
    };

    const response = await httpClient.sendRequest<{
      subscriptions: Sequence[];
    }>(request);

    if (response.status !== 200) {
      throw new Error(
        `Error listing subscriptions to sequence: ${response.status}`
      );
    }
    return response.body.subscriptions;
  },
});
