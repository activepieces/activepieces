import { Property } from '@activepieces/pieces-framework';

function format<R extends boolean>({ required, displayName = 'Response Format', description = 'Format of the response' }: PropParams<R>) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    defaultValue: 'JSON',
    options: {
      options: [
        { label: 'JSON', value: 'JSON' },
        { label: 'XML', value: 'XML' },
        { label: 'CSV', value: 'CSV' },
        { label: 'Newline', value: 'Newline' },
      ],
    },
  });
}

function mode<R extends boolean>({ required, displayName = 'Environment', description = 'Environment mode for testing or production' }: PropParams<R>) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    defaultValue: 'live',
    options: {
      options: [
        { label: 'Live', value: 'live' },
        { label: 'Test', value: 'test' },
      ],
    },
  });
}

function userID<R extends boolean>({
  required,
  displayName = 'User Identifier',
  description = 'Identify requests from specific users for monitoring (e.g., email, phone, user ID)',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function callback<R extends boolean>({ required, displayName = 'JSONP Callback', description = 'Function name for JSONP response format' }: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

export const greipProps = { format, mode, userID, callback };

export type PropParams<R extends boolean> = { required: R; displayName?: string; description?: string };
