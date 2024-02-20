import { Property, createAction } from '@activepieces/pieces-framework';
import { quickzuAuth } from '../../..';
import { makeClient, quickzuCommon } from '../../common';
import { ProductUnit } from '../../common/constants';

export const updateProductAction = createAction({
  auth: quickzuAuth,
  name: 'quickzu_update_product',
  displayName: 'Update Product',
  description: 'Updates an existing product in store.',
  props: {
    productId: quickzuCommon.productId(true),
    name: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    desc: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    categoryId: quickzuCommon.categoryId(false),
    mrp: Property.Number({
      displayName: 'MRP Price',
      required: false,
    }),
    price: Property.Number({
      displayName: 'Selling Price',
      required: false,
      description: 'Selling price should be equal or less than MRP.',
    }),
    unit: Property.StaticDropdown({
      displayName: 'Unit',
      required: false,
      options: {
        disabled: false,
        options: Object.values(ProductUnit).map((val) => {
          return {
            label: val,
            value: val,
          };
        }),
      },
    }),
    value_per_unit: Property.Number({
      displayName: 'Unit Value',
      required: false,
    }),
    availability: Property.Checkbox({
      displayName: 'Availability',
      required: false,
    }),
    exclude_tax: Property.Checkbox({
      displayName: 'Exclude Tax',
      required: false,
    }),
    enable_variants: Property.Checkbox({
      displayName: 'Enable Variants',
      required: false,
    }),
    status: Property.Checkbox({
      displayName: 'Status',
      required: false,
    }),
  },
  async run(context) {
    const {
      name,
      productId,
      desc,
      categoryId,
      mrp,
      price,
      unit,
      value_per_unit,
      availability,
      exclude_tax,
      enable_variants,
      status,
    } = context.propsValue;

    const client = makeClient(context.auth);

    return await client.updateProduct(productId!, {
      name,
      desc,
      category: categoryId!,
      mrp,
      price,
      unit,
      value_per_unit,
      availability,
      exclude_tax,
      enable_variants,
      status,
      meta: {
        nonveg: false,
      },
    });
  },
});
