import { Property, Validators } from '@activepieces/pieces-framework';
import { CONVERTKIT_API_URL } from '../common/constants';

export const API_ENDPOINT = 'subscribers';

export const subscriberId = Property.ShortText({
  displayName: 'Subscriber ID',
  description: 'The subscriber ID',
  required: true,
});

export const fetchSubscriberByEmail = async (
  auth: string,
  email_address: string
) => {
  const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}?api_secret=${auth}&email_address=${email_address}`;

  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }

  const data = await response.json();

  return data;
};

export const fetchSubscribedTags = async (
  auth: string,
  subscriberId: string
) => {
  const url = `${CONVERTKIT_API_URL}/${API_ENDPOINT}/${subscriberId}/tags?api_secret=${auth}`;
  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }
  return await response.json();
};

export const emailAddress = Property.ShortText({
  displayName: 'Email Address',
  description: 'The email address of the subscriber',
  required: false,
  validators: [Validators.email],
});

export const emailAddressRequired = Property.ShortText({
  displayName: 'Email Address',
  description: 'Email address',
  required: true,
  validators: [Validators.email],
});

export const firstName = Property.ShortText({
  displayName: 'First Name',
  description: 'First name',
  required: false,
});

export const page = Property.Number({
  displayName: 'Page',
  description:
    'Page number. Each page of results will contain up to 50 subscribers.',
  required: false,
  defaultValue: 1,
  validators: [Validators.number, Validators.nonZero],
});

export const from = Property.DateTime({
  displayName: 'From',
  description: 'Return subscribers created after this date',
  required: false,
  validators: [Validators.datetimeIso],
});

export const to = Property.DateTime({
  displayName: 'To',
  description: 'Return subscribers created before this date',
  required: false,
  validators: [Validators.datetimeIso],
});

export const updatedFrom = Property.DateTime({
  displayName: 'Updated From',
  description: 'Return subscribers updated after this date',
  required: false,
  validators: [Validators.datetimeIso],
});

export const updatedTo = Property.DateTime({
  displayName: 'Updated To',
  description: 'Return subscribers updated before this date',
  required: false,
  validators: [Validators.datetimeIso],
});

export const sortOrder = Property.StaticDropdown({
  displayName: 'Sort Order',
  description: 'Sort order',
  required: true,
  defaultValue: 'asc',
  options: {
    options: [
      { value: 'asc', label: 'Ascending' },
      { value: 'desc', label: 'Descending' },
    ],
  },
});

export const sortField = Property.ShortText({
  displayName: 'Sort Field',
  description: 'Sort field',
  required: false,
});
