import {
  createAction,
  Property,
  StoreScope,
  Validators,
} from '@activepieces/pieces-framework';

export const storageRemoveValue = createAction({
  name: 'remove_value',
  displayName: 'Remove',
  description: 'Remove a value from storage',
  errorHandlingOptions: {
    continueOnFailure: {
      hide: true,
    },
    retryOnFailure: {
      hide: true,
    },
  },
  props: {
    key: Property.ShortText({
      displayName: 'Key',
      required: true,
      validators: [Validators.maxLength(128)]
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
          {
            label: 'Run',
            value: StoreScope.RUN,
          },
        ],
      },
      defaultValue: StoreScope.PROJECT,
    }),
  },
  async run(context) {
    await context.store.delete(
      context.propsValue['key'],
      context.propsValue.store_scope
    );
    return {
      success: true,
    };
  },
});
