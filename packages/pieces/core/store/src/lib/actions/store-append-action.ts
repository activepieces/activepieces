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
import { isNil } from '@activepieces/pieces-framework';

async function executeStorageAppend(context: ActionContext<PieceAuthProperty | undefined, {
  key: ShortTextProperty<true>;
  value: ShortTextProperty<true>;
  separator: ShortTextProperty<false>;
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
  const oldValue = (await context.store.get(key, scope)) || '';
  if (typeof oldValue !== 'string') {
    throw new Error(`Key ${context.propsValue.key} is not a string`);
  }
  const appendValue = context.propsValue.value;
  if (appendValue === '' || isNil(appendValue)) {
    return oldValue;
  }
  let separator = context.propsValue.separator || '';
  separator = separator.replace(/\\n/g, '\n'); // Allow newline escape sequence
  const newValue =
    oldValue + (oldValue.length > 0 ? separator : '') + appendValue;
  return await context.store.put(key, newValue, scope);
}

export const storageAppendAction = createAction({
  audience: 'both',
  name: 'append',
  displayName: 'Append',
  description: 'Append to a value in storage',
  aiMetadata: { description: 'Concatenates text onto the string already stored under a key, optionally inserting a separator between the old and new text. Use it to accumulate a growing log across runs; prefer Put to replace the value outright, or Add To List when the stored value is an array rather than a string. Requires the key (max 128 characters), the value, and the Store Scope, fails if the existing value is not a string, caps the stored value at 512 KB, and is not idempotent since each call appends again.', idempotent: false },
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
    separator: Property.ShortText({
      displayName: 'Separator',
      description: 'Separator between added values, use \\n for newlines',
      required: false,
    }),
    store_scope: common.store_scope,
  },
  async run(context) {
    return await executeStorageAppend(context, false);
  },
  async test(context) {
    return await executeStorageAppend(context, true);
  },
});
