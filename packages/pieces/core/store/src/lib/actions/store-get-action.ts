import {
  ActionContext,
  createAction,
  PieceAuthProperty,
  Property,
  ShortTextProperty,
  StaticDropdownProperty,
  StoreScope,
} from '@activepieces/pieces-framework';
import { getScopeAndKey, PieceStoreScope } from './common';
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
  displayName: 'Get',
  description: 'Get a value from storage',
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
      required: true,
    }),
    defaultValue: Property.ShortText({
      displayName: 'Default Value',
      required: false,
    }),
    store_scope: Property.StaticDropdown({
      displayName: 'Store Scope',
      description: 'The storage scope of the value.',
      required: true,
      options: {
        options: [
          {
            label: 'Project',
            value: PieceStoreScope.PROJECT,
          },
          {
            label: 'Flow',
            value: PieceStoreScope.FLOW,
          },
          {
            label: 'Run',
            value: PieceStoreScope.RUN,
          },
        ],
      },
      defaultValue: StoreScope.PROJECT,
    }),
  },
  async run(context) {
    return await executeStorageGet(context, false);
  },
  async test(context) {
    return await executeStorageGet(context, true);
  },
});
