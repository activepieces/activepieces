import {
  createAction,
  Property,
  Validators,
} from '@activepieces/pieces-framework';
import deepEqual from 'deep-equal';
import { common, getScopeAndKey } from './common';

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
    const items =
      (await context.store.get<unknown[]>(
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
  },
});
