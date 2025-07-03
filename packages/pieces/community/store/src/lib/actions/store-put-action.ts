import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { common, getScopeAndKey } from './common';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';

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
    }),
    value: Property.ShortText({
      displayName: 'Value',
      required: true,
    }),
    store_scope: common.store_scope,
  },
  async run(context) {
    await propsValidation.validateZod(context.propsValue, {
      key: z.string().max(128),
    });

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
