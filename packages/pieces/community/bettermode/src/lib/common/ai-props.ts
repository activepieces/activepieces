import { Property } from '@activepieces/pieces-framework';

function id({ displayName, description }: { displayName: string; description: string }) {
  return Property.ShortText({ displayName, description, required: true });
}

function optionalId({ displayName, description }: { displayName: string; description: string }) {
  return Property.ShortText({ displayName, description, required: false });
}

function limit() {
  return Property.Number({
    displayName: 'Limit',
    description: 'How many items to return (1-100). Defaults to 20.',
    required: false,
    defaultValue: 20,
  });
}

function cursor() {
  return Property.ShortText({
    displayName: 'Cursor',
    description: 'The next_cursor value from a previous call, to fetch the next page. Leave empty for the first page.',
    required: false,
  });
}

export const bettermodeAiProps = { id, optionalId, limit, cursor };
