import { createAction, Property } from '@activepieces/pieces-framework';
import { dataforb2bAuth, dataForB2BGet, typeaheadTypeOptions } from '../common';

export const typeahead = createAction({
  auth: dataforb2bAuth,
  name: 'typeahead',
  displayName: 'Typeahead',
  description:
    'Resolve the exact stored value for a search filter (company, industry, category, location, school, title, skill, investor). Use it before filtering, or when a search returns few/no results.',
  props: {
    type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'The category to autocomplete',
      required: true,
      options: { options: typeaheadTypeOptions },
    }),
    q: Property.ShortText({
      displayName: 'Query',
      description: 'Partial text to autocomplete (1-100 characters), e.g. "pyth"',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results (1-20)',
      required: false,
      defaultValue: 20,
    }),
  },
  async run(context) {
    const { type, q, limit } = context.propsValue;
    const clamped = Math.max(1, Math.min(Number(limit ?? 20), 20));
    return dataForB2BGet(context.auth.secret_text, '/typeahead', {
      type: type as string,
      q: q as string,
      limit: String(clamped),
    });
  },
});
