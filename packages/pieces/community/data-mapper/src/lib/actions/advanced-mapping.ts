import { createAction, Property } from '@ensemble/pieces-framework';

export const advancedMapping = createAction({
  name: 'advanced_mapping',
  displayName: 'Advanced Mapping',
  description: 'Map data from one format to another',
  errorHandlingOptions: {
    continueOnFailure: {
      hide: true,
    },
    retryOnFailure: {
      hide: true,
    },
  },
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
