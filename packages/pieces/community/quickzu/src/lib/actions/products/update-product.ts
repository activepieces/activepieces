import { Property, createAction } from '@activepieces/pieces-framework';
import { quickzuAuth } from '../../auth';
import { quickzuOutputSchemas } from '../../common/output-schemas';
import { makeClient, quickzuCommon, requireValue } from '../../common';
import { ProductUnit } from '../../common/constants';
import { QuickzuAPIClient } from '../../common/client';
import { ProductInput } from '../../common/types';

export const updateProductAction = createAction({
  auth: quickzuAuth,
  name: 'quickzu_update_product',
  outputSchema: quickzuOutputSchemas.product,
  classification: 'WRITE',
  displayName: 'Update Product',
  description: 'Updates an existing product in store.',
  audience: 'both',
  aiMetadata: {
    description:
      'Updates an existing Quickzu product identified by its product ID; only the provided fields (name, price, category, availability, etc.) are changed. Use to edit a product already in the catalog. Idempotent: repeating with the same input leaves the product in the same state.',
    idempotent: true,
  },
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
    availability: keepOrSet('Availability'),
    exclude_tax: keepOrSet('Exclude Tax'),
    enable_variants: keepOrSet('Enable Variants'),
    status: keepOrSet('Status'),
    nonveg: keepOrSet('Non-Veg'),
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
      nonveg,
    } = context.propsValue;

    const client = makeClient(context.auth);
    const id = requireValue({ value: productId, label: 'Product' });
    const changes: Partial<ProductInput> = {
      name,
      desc,
      category: categoryId,
      mrp,
      price,
      unit,
      value_per_unit,
    };
    const filled = await fillRequiredProductFields({
      client,
      productId: id,
      changes,
      flags: { availability, exclude_tax, enable_variants, status, nonveg },
    });

    return await client.updateProduct({
      productId: id,
      productInput: {
        ...changes,
        ...filled,
      },
    });
  },
});

async function fillRequiredProductFields({
  client,
  productId,
  changes,
  flags,
}: {
  client: QuickzuAPIClient;
  productId: string;
  changes: Partial<ProductInput>;
  flags: ProductFlags;
}): Promise<
  Pick<
    ProductInput,
    | 'name'
    | 'category'
    | 'mrp'
    | 'price'
    | 'unit'
    | 'value_per_unit'
    | 'availability'
    | 'exclude_tax'
    | 'enable_variants'
    | 'status'
    | 'meta'
  >
> {
  const missing =
    Object.values(flags).some((flag) => isBlank(flag)) ||
    REQUIRED_PRODUCT_FIELDS.some((field) => isBlank(changes[field]));
  const current = missing ? await client.getProduct(productId) : undefined;
  if (missing && !current) {
    throw new Error(`Product ${productId} was not found in the store.`);
  }
  return {
    name: pick({ value: changes.name, fallback: current?.name }) ?? '',
    category:
      pick({ value: changes.category, fallback: categoryIdOf(current?.category) }) ?? '',
    mrp: pick({ value: changes.mrp, fallback: current?.mrp }) ?? 0,
    price: pick({ value: changes.price, fallback: current?.price }),
    unit: pick({ value: changes.unit, fallback: current?.unit }) ?? '',
    value_per_unit: pick({ value: changes.value_per_unit, fallback: current?.value_per_unit }) ?? 0,
    availability: pick({ value: flags.availability, fallback: current?.availability }) ?? false,
    exclude_tax: pick({ value: flags.exclude_tax, fallback: current?.exclude_tax }) ?? false,
    enable_variants:
      pick({ value: flags.enable_variants, fallback: current?.enable_variants }) ?? false,
    status: pick({ value: flags.status, fallback: current?.status }) ?? false,
    meta: { nonveg: pick({ value: flags.nonveg, fallback: current?.meta?.nonveg }) ?? false },
  };
}

function keepOrSet(displayName: string) {
  return Property.StaticDropdown<boolean>({
    displayName,
    required: false,
    options: {
      disabled: false,
      placeholder: 'Keep current setting',
      options: [
        { label: 'Yes', value: true },
        { label: 'No', value: false },
      ],
    },
  });
}

type ProductFlags = {
  availability: boolean | undefined;
  exclude_tax: boolean | undefined;
  enable_variants: boolean | undefined;
  status: boolean | undefined;
  nonveg: boolean | undefined;
};

function categoryIdOf(category: unknown): string | undefined {
  if (typeof category === 'string') return category;
  if (typeof category === 'object' && category !== null) {
    const id: unknown = Reflect.get(category, '_id');
    return typeof id === 'string' ? id : undefined;
  }
  return undefined;
}

function pick<T>({ value, fallback }: { value: T | undefined; fallback: T | undefined }): T | undefined {
  return isBlank(value) ? fallback : value;
}

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || (typeof value === 'string' && value.trim().length === 0);
}

const REQUIRED_PRODUCT_FIELDS: (keyof ProductInput)[] = ['name', 'category', 'mrp', 'price', 'unit', 'value_per_unit'];
