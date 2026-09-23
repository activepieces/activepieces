import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlCollection,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiCreateSmartCollection = createAction({
  auth: shopifyAuth,
  name: 'create_smart_collection',
  classification: 'WRITE',
  displayName: 'Create Smart Collection',
  description: 'Create a rule-based collection that automatically includes products matching conditions.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates one collection whose products are chosen automatically by conditions, for example product tag TAGGED_WITH "summer" or variant price LESS_THAN 25. match_type ALL requires every condition, ANY requires at least one. Price conditions need currency. Membership is computed by Shopify and may take a moment. Not available on Starter or Retail plans. Each call creates another collection, so retries create duplicates.',
    idempotent: false,
  },
  props: {
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Collection title, for example "Summer Items".',
      required: true,
    }),
    match_type: Property.StaticDropdown({
      displayName: 'Match',
      description: 'Whether products must match all conditions or any of them.',
      required: true,
      options: {
        options: [
          { label: 'All conditions', value: 'ALL' },
          { label: 'Any condition', value: 'ANY' },
        ],
      },
    }),
    conditions: shopifyProps.conditions({
      required: true,
      description: 'The rules products must match, for example field product_tag, relation TAGGED_WITH, value "summer".',
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'Shop currency code for price conditions, for example "USD".',
      required: false,
    }),
    description_html: Property.LongText({
      displayName: 'Description (HTML)',
      description: 'Collection description, HTML allowed.',
      required: false,
    }),
    handle: Property.ShortText({
      displayName: 'Handle',
      description: 'URL handle, for example "summer-items". Generated from the title when empty.',
      required: false,
    }),
    sort_order: shopifyProps.collectionSortOrder(),
    template_suffix: Property.ShortText({
      displayName: 'Template Suffix',
      description: 'Theme template suffix, for example "sale".',
      required: false,
    }),
    seo_title: Property.ShortText({
      displayName: 'SEO Title',
      description: 'Page title for search engines.',
      required: false,
    }),
    seo_description: Property.LongText({
      displayName: 'SEO Description',
      description: 'Meta description for search engines.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const conditions = shopifyValues.buildConditions({
      value: propsValue.conditions,
      currency: shopifyValues.nonEmpty(propsValue.currency)?.toUpperCase(),
    });
    if (conditions.length === 0) {
      throw new Error('Provide at least one condition.');
    }
    const collection = shopifyValues.compact({
      title: propsValue.title,
      descriptionHtml: shopifyValues.nonEmpty(propsValue.description_html),
      handle: shopifyValues.nonEmpty(propsValue.handle),
      sortOrder: propsValue.sort_order,
      templateSuffix: shopifyValues.nonEmpty(propsValue.template_suffix),
      seo: shopifyValues.toSeo({ title: propsValue.seo_title, description: propsValue.seo_description }),
      sources: [
        {
          source: {
            title: shopifyFields.CONDITIONS_SOURCE_TITLE,
            inclusion: { matchType: propsValue.match_type, conditions },
          },
        },
      ],
    });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      collectionCreate: { collection: GqlCollection | null } | null;
    }>({
      auth,
      query: `mutation CreateSmartCollection($collection: CollectionCreateInput!) { collectionCreate(collection: $collection) { collection { ${shopifyFields.COLLECTION_FIELDS} } userErrors { field message } } }`,
      variables: { collection },
    });
    const created = data.collectionCreate?.collection;
    if (!created) {
      throw new Error('Shopify did not return the new collection.');
    }
    return {
      ...shopifyMappers.mapCollection(created),
      redacted_fields: redactedFields,
    };
  },
});
