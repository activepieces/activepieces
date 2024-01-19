import {
  createAction,
  Property,
  StoreScope,
} from '@activepieces/pieces-framework';

export const storagePutAction = createAction({
  name: 'put',
  displayName: 'Put',
  description: 'Put a value in storage',
  props: {
    key: Property.ShortText({
      displayName: 'Key',
      required: true,
    }),
    value: Property.ShortText({
      displayName: 'Value',
      required: true,
    }),
    store_scope: Property.StaticDropdown({
      displayName: 'Store Scope',
      description: 'The storage scope of the value.',
      required: true,
      options: {
        options: [
          {
            label: 'Project',
            value: StoreScope.PROJECT,
          },
          {
            label: 'Flow',
            value: StoreScope.FLOW,
          },
        ],
      },
      defaultValue: StoreScope.PROJECT,
    }),
  },
  async run(context) {
    return await context.store.put(
      context.propsValue['key'],
      context.propsValue['value'],
      context.propsValue.store_scope
    );
  },
});
