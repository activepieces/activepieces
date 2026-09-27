import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlProduct,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';
import type { ShopifyAuth } from '../../common/types';
import { setProductOutputSchema } from '../../output-schemas/products';

export const shopifyAiSetProduct = createAction({
  auth: shopifyAuth,
  name: 'set_product',
  classification: 'DESTRUCTIVE',
  displayName: 'Set Product (Full State)',
  description: 'Create or overwrite a whole product, including all its options and variants, in one call.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Declarative create-or-update of a complete product: sends the full list of options and variants you want the product to have. WARNING: on an existing product every variant and every option value not included here is DELETED, together with its stock and sales history links. Use update_product_fields to change single fields, and the variant and option actions for targeted changes. With product_id or product_handle an existing product is overwritten; a handle is looked up first and, if no product has it, the call is refused and nothing is created. Only with neither product_id nor product_handle is a new product created (status defaults to DRAFT); the output field created tells which happened. Tags, when sent, replace all tags. Collections and metafields are not sent by this action, so they are left unchanged. Sending the same full state again to the same product gives the same result; repeating a create (no id or handle) makes another product.',
    idempotent: false,
  },
  outputSchema: setProductOutputSchema,
  props: {
    product_id: Property.ShortText({
      displayName: 'Product ID',
      description: 'The product to overwrite, numeric or "gid://shopify/Product/…". Leave empty (and no handle) to create a new product.',
      required: false,
    }),
    product_handle: Property.ShortText({
      displayName: 'Product Handle',
      description: 'Alternative to Product ID: the handle of an existing product to overwrite, for example "organic-cotton-t-shirt". If no product has this handle the call fails; it never creates a product.',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Product title. Required when creating a new product.',
      required: false,
    }),
    description_html: Property.LongText({
      displayName: 'Description (HTML)',
      description: 'Product description, HTML allowed.',
      required: false,
    }),
    vendor: Property.ShortText({
      displayName: 'Vendor',
      description: 'Brand or vendor name.',
      required: false,
    }),
    product_type: Property.ShortText({
      displayName: 'Product Type',
      description: 'Merchant-defined product type.',
      required: false,
    }),
    status: shopifyProps.productStatus({
      description: 'Product status. On a new product defaults to Draft; on an existing product leave empty to keep it.',
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'The complete tag list. Replaces every existing tag; leave empty to keep the current tags.',
      required: false,
    }),
    product_options: Property.Array({
      displayName: 'Options',
      description: 'Every option the product must have, in order, for example Size with values "S, M, L". Options not listed are removed.',
      required: true,
      properties: {
        name: Property.ShortText({
          displayName: 'Option Name',
          description: 'Option name, for example "Size".',
          required: true,
        }),
        values: Property.ShortText({
          displayName: 'Values',
          description: 'Comma-separated option values, for example "S, M, L".',
          required: true,
        }),
      },
    }),
    variants: Property.Array({
      displayName: 'Variants',
      description: 'Every variant the product must have. Variants not listed are deleted.',
      required: true,
      properties: {
        option_values: Property.ShortText({
          displayName: 'Option Values',
          description: 'One value per option, for example "Size=M, Color=Red".',
          required: true,
        }),
        price: Property.Number({
          displayName: 'Price',
          description: 'Price in the shop currency, for example 19.99.',
          required: false,
        }),
        compare_at_price: Property.Number({
          displayName: 'Compare-at Price',
          description: 'Original price shown struck through, for example 24.99.',
          required: false,
        }),
        sku: Property.ShortText({
          displayName: 'SKU',
          description: 'Stock keeping unit, for example "TSHIRT-M-RED".',
          required: false,
        }),
        barcode: Property.ShortText({
          displayName: 'Barcode',
          description: 'Barcode such as a UPC or ISBN.',
          required: false,
        }),
        inventory_policy: Property.StaticDropdown({
          displayName: 'When Out of Stock',
          description: 'Whether customers can buy the variant when it is out of stock.',
          required: false,
          options: {
            options: [
              { label: 'Stop selling (deny)', value: 'DENY' },
              { label: 'Continue selling', value: 'CONTINUE' },
            ],
          },
        }),
      },
    }),
  },
  async run({ auth, propsValue }) {
    const productId = shopifyValues.nonEmpty(propsValue.product_id);
    const productHandle = shopifyValues.nonEmpty(propsValue.product_handle);
    const isUpdate = productId !== undefined || productHandle !== undefined;
    const title = shopifyValues.nonEmpty(propsValue.title);
    if (!isUpdate && !title) {
      throw new Error('Give a title to create a new product, or a product_id / product_handle to overwrite one.');
    }
    const productOptions = shopifyValues.readRecords(propsValue.product_options).map((option, index) => {
      const name = shopifyValues.readText(option['name']);
      const values = shopifyValues.splitList(option['values']);
      if (!name || values.length === 0) {
        throw new Error('Every option needs a name and at least one value.');
      }
      return { name, position: index + 1, values: values.map((value) => ({ name: value })) };
    });
    const variants = shopifyValues.readRecords(propsValue.variants).map((variant) => {
      const optionValues = shopifyValues.parseOptionValues(variant['option_values']);
      if (optionValues.length === 0) {
        throw new Error('Every variant needs option_values, for example "Size=M, Color=Red".');
      }
      const price = shopifyValues.readNumber(variant['price']);
      const compareAtPrice = shopifyValues.readNumber(variant['compare_at_price']);
      return shopifyValues.compact({
        optionValues,
        price: price !== undefined ? String(price) : undefined,
        compareAtPrice: compareAtPrice !== undefined ? String(compareAtPrice) : undefined,
        sku: shopifyValues.readText(variant['sku']),
        barcode: shopifyValues.readText(variant['barcode']),
        inventoryPolicy: shopifyValues.readText(variant['inventory_policy']),
      });
    });
    if (productOptions.length === 0 || variants.length === 0) {
      throw new Error('set_product needs the full list of options and variants. Use update_product_fields to change single fields.');
    }
    const tags = shopifyValues.readStringList(propsValue.tags);
    const input = shopifyValues.compact({
      title,
      descriptionHtml: shopifyValues.nonEmpty(propsValue.description_html),
      vendor: shopifyValues.nonEmpty(propsValue.vendor),
      productType: shopifyValues.nonEmpty(propsValue.product_type),
      status: propsValue.status ?? (isUpdate ? undefined : 'DRAFT'),
      tags: tags && tags.length > 0 ? tags : undefined,
      productOptions,
      variants,
    });
    const resolved = isUpdate
      ? await resolveExistingProduct({ auth, productId, productHandle })
      : { identifier: undefined, redactedFields: [] };
    const identifier = resolved.identifier;
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      productSet: { product: GqlProduct | null } | null;
    }>({
      auth,
      query: `mutation SetProduct($input: ProductSetInput!, $identifier: ProductSetIdentifiers) { productSet(input: $input, identifier: $identifier, synchronous: true) { product { ${shopifyFields.PRODUCT_DETAIL_FIELDS} } userErrors { field message code } } }`,
      variables: shopifyValues.compact({ input, identifier }),
    });
    const product = data.productSet?.product;
    if (!product) {
      throw new Error('Shopify did not return the product.');
    }
    return {
      ...shopifyMappers.mapProductDetail(product),
      created: !isUpdate,
      redacted_fields: [...resolved.redactedFields, ...redactedFields],
    };
  },
});

async function resolveExistingProduct({
  auth,
  productId,
  productHandle,
}: {
  auth: ShopifyAuth;
  productId: string | undefined;
  productHandle: string | undefined;
}): Promise<{ identifier: { id: string }; redactedFields: string[] }> {
  if (productId !== undefined) {
    return { identifier: { id: shopifyGraphqlClient.toGid({ type: 'Product', id: productId }) }, redactedFields: [] };
  }
  const { data, redactedFields } = await shopifyGraphqlClient.request<{
    productByIdentifier: { id: string } | null;
  }>({
    auth,
    query: 'query SetProductResolveHandle($identifier: ProductIdentifierInput!) { productByIdentifier(identifier: $identifier) { id } }',
    variables: { identifier: { handle: productHandle } },
  });
  const found = data.productByIdentifier;
  if (!found) {
    throw new Error(`No product with handle "${productHandle ?? ''}"; omit the handle to create one. Nothing was changed.`);
  }
  return { identifier: { id: found.id }, redactedFields };
}
