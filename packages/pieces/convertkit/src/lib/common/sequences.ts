import { Property, Validators } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { Sequence } from './models';
import { CONVERTKIT_API_URL } from '../common/constants';

export const API_ENDPOINT = 'sequences';

export const sequenceId = Property.ShortText({
  displayName: 'Sequence ID',
  description: 'The sequence ID',
  required: true,
});

export const fetchSequences = async (auth: string) => {
  const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}`;
  const body = {
    api_secret: auth,
  };
  const request: HttpRequest = {
    url,
    body,
    method: HttpMethod.GET,
  };
  const response = await httpClient.sendRequest<{ courses: Sequence[] }>(
    request
  );
  if (response.status !== 200) {
    throw new Error(
      `Failed to fetch sequences: ${response.status} ${response.body}`
    );
  }
  return response.body.courses;
};

export const email = Property.ShortText({
  displayName: 'Email',
  description: 'The email of the subscriber',
  required: true,
  validators: [Validators.email],
});

export const firstName = Property.ShortText({
  displayName: 'First Name',
  description: 'The first name of the subscriber',
  required: false,
});

export const sequenceIdChoice = Property.Dropdown({
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

    const sequences = await fetchSequences(auth.toString());

    // loop through data and map to options
    const options = sequences.map((field: { id: string; name: string }) => {
      return {
        label: field.name,
        value: field.id,
      };
    });

    return {
      options,
    };
  },
});
