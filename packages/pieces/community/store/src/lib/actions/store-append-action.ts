import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { common, getScopeAndKey } from './common';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';

export const storageAppendAction = createAction({
  name: 'append',
  displayName: 'Append',
  description: 'Append to a value in storage',
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
    await propsValidation.validateZod(context.propsValue, {
      key: z.string().max(128),
    });

    const { key, scope } = getScopeAndKey({
      runId: context.run.id,
      key: context.propsValue['key'],
      scope: context.propsValue.store_scope,
    });
    const oldValue = (await context.store.get(key, scope)) || '';
    if (typeof oldValue !== 'string') {
      throw new Error(`Key ${context.propsValue.key} is not a string`);
    }
    const appendValue = context.propsValue.value;
    let separator = context.propsValue.separator || '';
    separator = separator.replace(/\\n/g, '\n'); // Allow newline escape sequence
    const newValue =
      oldValue + (oldValue.length > 0 ? separator : '') + appendValue;
    return await context.store.put(key, newValue, scope);
  },
});
