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

async function executeStorageRemoveValue(context: ActionContext<PieceAuthProperty | undefined, {
  key: ShortTextProperty<true>;
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
  await context.store.delete(key, scope);
  return {
    success: true,
  };
}

export const storageRemoveValue = createAction({
  audience: 'both',
  name: 'remove_value',
  displayName: 'Remove',
  description: 'Remove a value from storage',
  aiMetadata: { description: 'Deletes a key and its value from the key/value store within the given scope. Use it to clear persisted state once it has been consumed or to reset a counter; use Remove from List instead to drop a single element while keeping the rest of a stored array. Requires the key (max 128 characters) and the Store Scope the value was written under; removing a key that does not exist is not an error, and the delete is idempotent.', idempotent: true },
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
    store_scope: common.store_scope,
  },
  async run(context) {
    return await executeStorageRemoveValue(context, false);
  },
  async test(context) {
    return await executeStorageRemoveValue(context, true);
  },
});
