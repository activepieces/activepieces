import { Property } from '@activepieces/pieces-framework';

export const subscriberId = Property.ShortText({
  displayName: 'Subscriber ID',
  description: "Find it in the subscriber's URL in Kit.",
  placeholder: '1234567',
  required: true,
});

export const subscriberEmail = Property.ShortText({
  displayName: 'Email',
  description: "The subscriber's email address.",
  placeholder: 'jane@example.com',
  required: true,
});

export const subscriberEmailOptional = {
  ...subscriberEmail,
  required: false,
};

export const subscriberFirstName = Property.ShortText({
  displayName: 'First Name',
  placeholder: 'Jane',
  required: false,
});

export const subscribersPageNumber = Property.Number({
  displayName: 'Page',
  description: 'Up to 50 subscribers per page.',
  required: false,
  defaultValue: 1,
});

export const from = Property.DateTime({
  displayName: 'Created After',
  required: false,
});

export const to = Property.DateTime({
  displayName: 'Created Before',
  required: false,
});

export const updatedFrom = Property.DateTime({
  displayName: 'Updated After',
  required: false,
});

export const updatedTo = Property.DateTime({
  displayName: 'Updated Before',
  required: false,
});

export const sortOrder = Property.StaticDropdown({
  displayName: 'Sort Order',
  description: 'Direction of the sort.',
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
  description: 'Field to sort by.',
  placeholder: 'id',
  required: false,
});
