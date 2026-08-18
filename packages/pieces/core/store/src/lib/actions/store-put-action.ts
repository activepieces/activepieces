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

async function executeStoragePut(context: ActionContext<PieceAuthProperty | undefined, {
  key: ShortTextProperty<true>;
  value: ShortTextProperty<true>;
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
  return await context.store.put(
    key,
    context.propsValue['value'],
   scope
  );
}

export const storagePutAction = createAction({
  audience: 'both',
  name: 'put',
  displayName: 'Put',
  description: 'Put a value in storage',
  aiMetadata: { description: 'Writes a value under a key in the key/value store, overwriting whatever was there before. Use it to persist state across steps, runs, or flows; prefer Append to concatenate onto an existing string, or Add To List to push onto a stored array, since Put replaces the entire value. Requires the key (max 128 characters), the value, and the Store Scope the reader will use, caps the stored value at 512 KB, and is idempotent.', idempotent: true },
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
    return await executeStoragePut(context, false);
  },
  async test(context) {
    return await executeStoragePut(context, true);
  },
});
