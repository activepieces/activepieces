import { Property, createAction } from '@activepieces/pieces-framework';
import { quickzuAuth } from '../../..';
import { makeClient, quickzuCommon } from '../../common';
import { ProductUnit } from '../../common/constants';

export const addProductAction = createAction({
  auth: quickzuAuth,
  name: 'quickzu_add_product',
  displayName: 'Add Product',
  description: 'Adds new product to store.',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      required: true,
    }),
    desc: Property.LongText({
      displayName: 'Description',
      required: false,
    }),
    categoryId: quickzuCommon.categoryId(true),
    mrp: Property.Number({
      displayName: 'MRP Price',
      required: true,
    }),
    price: Property.Number({
      displayName: 'Selling Price',
      required: false,
      description: 'Selling price should be equal or less than MRP.',
    }),
    unit: Property.StaticDropdown({
      displayName: 'Unit',
      required: true,
      defaultValue: 'kilogram',
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
      required: true,
      defaultValue: 1,
    }),
    availability: Property.Checkbox({
      displayName: 'Availability',
      required: true,
      defaultValue: true,
    }),
    exclude_tax: Property.Checkbox({
      displayName: 'Exclude Tax',
      required: true,
      defaultValue: false,
    }),
    enable_variants: Property.Checkbox({
      displayName: 'Enable Variants',
      required: true,
      defaultValue: false,
    }),
    status: Property.Checkbox({
      displayName: 'Status',
      required: true,
      defaultValue: true,
    }),
  },
  async run(context) {
    const {
      name,
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

    return await client.createProduct({
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
