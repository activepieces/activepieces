import { createAction } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { Sequence } from '../common/types';
import { convertkitAuth } from '../..';
import { sequenceIdDropdown } from '../common/sequences';
import { subscriberEmail, subscriberFirstName } from '../common/subscribers';
import { allFields } from '../common/custom-fields';
import { tags } from '../common/tags';
import { SEQUENCES_API_ENDPOINT } from '../common/constants';
import { fetchSequences } from '../common/service';

export const listSequences = createAction({
  auth: convertkitAuth,
  name: 'sequences_list_sequences',
  displayName: 'List Sequences',
  description: 'Returns a list of all sequences',
  props: {},
  run(context) {
    return fetchSequences(context.auth);
  },
});

export const addSubscriberToSequence = createAction({
  auth: convertkitAuth,
  name: 'sequences_add_subscriber_to_sequence',
  displayName: 'Add Subscriber To Sequence',
  description: 'Add a subscriber to a sequence',
  props: {
    sequenceId: sequenceIdDropdown,
    email: subscriberEmail,
    firstName: subscriberFirstName,
    tags,
    fields: allFields,
  },
  async run(context) {
    const { sequenceId, email, firstName, tags, fields } = context.propsValue;
    const url = `${SEQUENCES_API_ENDPOINT}/${sequenceId}/subscribe`;

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

export const listSubscriptionsToSequence = createAction({
  auth: convertkitAuth,
  name: 'sequences_list_subscriptions_to_sequence',
  displayName: 'List Subscriptions To Sequence',
  description: 'List all subscriptions to a sequence',
  props: {
    sequenceId: sequenceIdDropdown,
  },
  async run(context) {
    const url = `${SEQUENCES_API_ENDPOINT}/${context.propsValue.sequenceId}/subscriptions`;

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
