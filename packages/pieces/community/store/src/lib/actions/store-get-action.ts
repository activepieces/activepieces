import {
  createAction,
  Property,
  StoreScope,
} from '@activepieces/pieces-framework';
import { getScopeAndKey, PieceStoreScope } from './common';
import { z } from 'zod';
import { propsValidation } from '@activepieces/pieces-common';

export const storageGetAction = createAction({
  name: 'get',
  displayName: 'Get',
  description: 'Get a value from storage',
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
    await propsValidation.validateZod(context.propsValue, {
      key: z.string().max(128),
    });

    const { key, scope } = getScopeAndKey({
      runId: context.run.id,
      key: context.propsValue['key'],
      scope: context.propsValue.store_scope,
    });
    return (
      (await context.store.get(key, scope)) ?? context.propsValue['defaultValue']
    );
  },
});
