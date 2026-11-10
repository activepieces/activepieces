import { createAction, Property } from '@activepieces/pieces-framework';
import { freshsalesAuth } from '../auth';
import { freshsalesProps } from '../common/props';
import { listFieldOptionsOutputSchema } from '../output-schemas';

export const listFieldOptions = createAction({
  auth: freshsalesAuth,
  name: 'list_field_options',
  displayName: 'List Field Options',
  description: 'List options such as territories or lead sources',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the id and name of every option for one Freshsales picklist (territories, contact statuses, lifecycle stages, lead sources, campaigns, currencies, deal types, deal reasons, industry types, business types, sales activity types). Use it to resolve a name to the ID needed by create and update tools.',
    idempotent: true,
  },
  outputSchema: listFieldOptionsOutputSchema,
  props: {
    option_type: Property.StaticDropdown({
      displayName: 'Option Type',
      description: 'Which picklist to list',
      required: true,
      options: { disabled: false, options: freshsalesProps.SELECTOR_TYPES },
    }),
  },
  async run(context) {
    const optionType = context.propsValue.option_type;
    if (!freshsalesProps.SELECTOR_TYPES.some((option) => option.value === optionType)) {
      throw new Error(`Unsupported Option Type "${optionType}".`);
    }
    const items = await freshsalesProps.fetchSelector({
      auth: context.auth,
      path: `/api/selector/${optionType}`,
    });
    return { items: items.map((item) => ({ id: item.id, name: item.name })) };
  },
});
