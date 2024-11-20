import { Property } from '@activepieces/pieces-framework';

export const subscriberId = Property.ShortText({
  displayName: 'Subscriber ID',
  description: 'The subscriber ID',
  required: true,
});

export const subscriberEmail = Property.ShortText({
  displayName: 'Email',
  description: 'The email of the subscriber',
  required: true,
});

export const subscriberEmailOptional = {
  ...subscriberEmail,
  required: false,
};

export const subscriberFirstName = Property.ShortText({
  displayName: 'First Name',
  description: 'The first name of the subscriber',
  required: false,
});

export const subscribersPageNumber = Property.Number({
  displayName: 'Page',
  description:
    'Page number. Each page of results will contain up to 50 subscribers.',
  required: false,
  defaultValue: 1,
});

export const from = Property.DateTime({
  displayName: 'From',
  description: 'Return subscribers created after this date',
  required: false,
});

export const to = Property.DateTime({
  displayName: 'To',
  description: 'Return subscribers created before this date',
  required: false,
});

export const updatedFrom = Property.DateTime({
  displayName: 'Updated From',
  description: 'Return subscribers updated after this date',
  required: false,
});

export const updatedTo = Property.DateTime({
  displayName: 'Updated To',
  description: 'Return subscribers updated before this date',
  required: false,
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
