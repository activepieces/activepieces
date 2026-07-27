import { createAction, Property } from '@activepieces/pieces-framework';
import { fetchAllLists, sendgridAuth } from '../common';

export const findListByName = createAction({
  auth: sendgridAuth,
  name: 'find_list_by_name',
  displayName: 'Find List by Name',
  description: 'Search for a list by its name',
  audience: 'both',
  aiMetadata: {
    description:
      'Finds SendGrid marketing lists whose name matches the given value (case-insensitive, exact). Returns every matching list since names are not guaranteed unique. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    name: Property.ShortText({
      displayName: 'List Name',
      description: 'The exact name of the list to search for',
      required: true,
    }),
  },
  async run(context) {
    const { name } = context.propsValue;
    const target = name.trim().toLowerCase();

    const lists = await fetchAllLists(context.auth);
    const matches = lists.filter(
      (list) => list.name.trim().toLowerCase() === target
    );

    return {
      found: matches.length > 0,
      lists: matches,
    };
  },
});
