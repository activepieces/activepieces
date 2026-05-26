import { createAction, Property } from '@activepieces/pieces-framework';
import { CatalogItemSchema } from '../common/types';
import {
  catalogItemDropdown,
  createServiceNowClient,
  servicenowAuth,
  resolveSysId,
} from '../common/props';

export const getCatalogItemAction = createAction({
  auth: servicenowAuth,
  name: 'get_catalog_item',
  displayName: 'Get Catalog Item',
  description:
    'Retrieve full details of a catalog item including its variable definitions. Use this before "Submit Catalog Request" to discover the variables expected by the item.',
  props: {
    item_sys_id: catalogItemDropdown,
    manual_item_sys_id: Property.ShortText({
      displayName: 'Or Enter Catalog Item Sys ID Manually',
      description:
        'Provide the catalog item sys_id directly if it is not in the dropdown',
      required: false,
    }),
  },
  async run(context) {
    const { item_sys_id, manual_item_sys_id } = context.propsValue;
    const sysId = resolveSysId({
      selected: item_sys_id,
      manual: manual_item_sys_id,
      label: 'catalog item',
    });

    const client = createServiceNowClient(context.auth);
    const result = await client.getCatalogItem({ item_sys_id: sysId });

    return CatalogItemSchema.parse(result);
  },
});
