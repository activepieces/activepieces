import {
  createAction,
  Property,
  StoreScope,
} from '@activepieces/pieces-framework';
import deepEqual from 'deep-equal';

export const storageAddtoList = createAction({
  name: 'add_to_list',
  displayName: 'Add To List',
  description: 'Add Item to a list',
  props: {
    key: Property.ShortText({
      displayName: 'Key',
      required: true,
    }),
    value: Property.ShortText({
      displayName: 'Value',
      required: true,
    }),
    ignore_if_exists: Property.Checkbox({
      displayName: 'Ignore if value exists',
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
            value: StoreScope.PROJECT,
          },
          {
            label: 'Flow',
            value: StoreScope.FLOW,
          },
        ],
      },
      defaultValue: StoreScope.PROJECT,
    }),
  },
  async run(context) {
    let items =
      (await context.store.get<unknown[]>(
        context.propsValue['key'],
        context.propsValue.store_scope
      )) ?? [];
    try {
      if(typeof items === 'string') {
        items = JSON.parse(items)
      }
      if (!Array.isArray(items)) {
        throw new Error(`Key ${context.propsValue['key']} is not an array`);
      }
    } catch(err) {
      throw new Error(`Key ${context.propsValue['key']} is not an array`);
    }
    if (context.propsValue['ignore_if_exists']) {
      for (const item of items) {
        if (deepEqual(item, context.propsValue['value'])) {
          return items;
        }
      }
    }
    items.push(context.propsValue['value']);
    return await context.store.put(
      context.propsValue['key'],
      items,
      context.propsValue.store_scope
    );
  },
});
