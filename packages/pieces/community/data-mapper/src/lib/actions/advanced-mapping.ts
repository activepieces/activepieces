import { createAction, Property } from '@activepieces/pieces-framework';

export const advancedMapping = createAction({
  name: 'advanced_mapping',
  displayName: 'Advanced Mapping',
  description: 'Map data from one format to another',
  props: {
    mapping: Property.Json({
      displayName: 'Mapping',
      description: 'The mapping to use',
      required: true,
      defaultValue: {
        newProperty: 'oldProperty',
      },
    }),
  },
  async run(ctx) {
    return ctx.propsValue.mapping;
  },
});
