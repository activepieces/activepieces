import {
  ActionContext,
  createAction,
  PieceAuthProperty,
  Property,
  ShortTextProperty,
  StaticDropdownProperty,
} from '@activepieces/pieces-framework';
import { common, getScopeAndKey, PieceStoreScope } from './common';
import * as z from 'zod/mini'
import { propsValidation } from '@activepieces/pieces-common';

async function executeStorageGet(context: ActionContext<PieceAuthProperty | undefined, {
  key: ShortTextProperty<true>;
  defaultValue: ShortTextProperty<false>;
  store_scope: StaticDropdownProperty<PieceStoreScope, true>;
}>, isTestMode = false) {
  await propsValidation.validateZod(context.propsValue, {
    key: z.string().check(z.maxLength(128)),
  });

  const { key, scope } = getScopeAndKey({
    runId: context.run.id,
    key: context.propsValue['key'],
    scope: context.propsValue.store_scope,
    isTestMode,
  });
  return (
    (await context.store.get(key, scope)) ?? context.propsValue['defaultValue']
  );
}

export const storageGetAction = createAction({
  audience: 'both',
  name: 'get',
  classification: 'READ',
  displayName: 'Get',
  description: 'Read the value saved under a key.',
  aiMetadata: { description: 'Reads the value stored under a key in the key/value store, falling back to an optional default value when the key is missing. Use it to load state persisted by an earlier step, run, or flow; pair it with Put, which writes the value. Requires the key (max 128 characters) and the matching Store Scope, because a key written in one scope is invisible to the others; read-only and idempotent.', idempotent: true },
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
      description: 'Name the value is saved under, up to 128 characters.',
      placeholder: 'last_order_id',
      required: true,
    }),
    store_scope: common.store_scope,
    defaultValue: Property.ShortText({
      displayName: 'Default Value',
      description: 'Returned when nothing is saved under this key.',
      required: false,
    }),
  },
  async run(context) {
    return await executeStorageGet(context, false);
  },
  async test(context) {
    return await executeStorageGet(context, true);
  },
});
