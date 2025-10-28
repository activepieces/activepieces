import {
  ActionContext,
  createAction,
  PieceAuthProperty,
  Property,
  ShortTextProperty,
  StaticDropdownProperty,
} from '@activepieces/pieces-framework';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';
import deepEqual from 'deep-equal';
import { common, getScopeAndKey, PieceStoreScope } from './common';

async function executeStorageRemoveFromList(context: ActionContext<PieceAuthProperty, {
  key: ShortTextProperty<true>;
  value: ShortTextProperty<true>;
  store_scope: StaticDropdownProperty<PieceStoreScope, true>;
}>, isTestMode = false) {
  await propsValidation.validateZod(context.propsValue, {
    key: z.string().max(128),
  });

  const { key, scope } = getScopeAndKey({
    runId: context.run.id,
    key: context.propsValue['key'],
    scope: context.propsValue.store_scope,
    isTestMode,
  });
  const items =
    (await context.store.get(
      key,
      scope,
    )) ?? [];
  if (!Array.isArray(items)) {
    throw new Error(`Key ${context.propsValue['key']} is not an array`);
  }
  for (let i = 0; i < items.length; i++) {
    if (deepEqual(items[i], context.propsValue['value'])) {
      items.splice(i, 1);
      return await context.store.put(
        key,
        items,
        scope,
      );
    }
  }
  if (items.includes(context.propsValue['value'])) {
    items.splice(items.indexOf(context.propsValue['value']), 1);
  }
  return await context.store.put(
    key,
    items,
    scope,
  );
}

export const storageRemoveFromList = createAction({
  name: 'remove_from_list',
  displayName: 'Remove from List',
  description: 'Remove Item from a list',
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
    return await executeStorageRemoveFromList(context, false);
  },
  async test(context) {
    return await executeStorageRemoveFromList(context, true);
  },
});
