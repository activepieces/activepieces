import {
  createAction,
  Property,
  StoreScope,
  Validators,
} from '@activepieces/pieces-framework';
import { common, getScopeAndKey } from './common';

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
    store_scope: common.store_scope,
  },
  async run(context) {
    const { key, scope } = getScopeAndKey({
      runId: context.run.id,
      key: context.propsValue['key'],
      scope: context.propsValue.store_scope,
    });
    await context.store.delete(key, scope);
    return {
      success: true,
    };
  },
});
