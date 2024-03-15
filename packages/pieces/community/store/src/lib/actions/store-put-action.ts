import {
  createAction,
  Property,
  Validators,
} from '@activepieces/pieces-framework';
import { common, getScopeAndKey } from './common';

export const storagePutAction = createAction({
  name: 'put',
  displayName: 'Put',
  description: 'Put a value in storage',
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
    value: Property.ShortText({
      displayName: 'Value',
      required: true,
    }),
    store_scope: common.store_scope,
  },
  async run(context) {
    const { key, scope } = getScopeAndKey({
      runId: context.run.id,
      key: context.propsValue['key'],
      scope: context.propsValue.store_scope,
    });
    return await context.store.put(
      key,
      context.propsValue['value'],
     scope
    );
  },
});
