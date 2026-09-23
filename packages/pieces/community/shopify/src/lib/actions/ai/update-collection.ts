import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlCollection,
  GqlJob,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiUpdateCollection = createAction({
  auth: shopifyAuth,
  name: 'update_collection',
  classification: 'WRITE',
  displayName: 'Update Collection',
  description: 'Change a collection\'s title, description, handle, sort order, image or SEO, and add or remove its rule conditions.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes one collection; fields left empty are not sent and keep their values. Rule conditions change only through explicit edits on one conditions source: conditions_to_add adds new conditions, condition_ids_to_delete removes conditions by id, match_type switches ALL/ANY; the source id and condition ids come from get_collection. Nothing is replaced implicitly. Manual product picks are changed with add_products_to_collection and remove_products_from_collection. Membership changes can finish in the background (job_id, poll get_job). Re-running the same field values is safe; adding the same condition twice creates a duplicate condition.',
    idempotent: false,
  },
  props: {
    collection_id: Property.ShortText({
      displayName: 'Collection ID',
      description: 'The collection id, numeric or "gid://shopify/Collection/…". Find it with search_collections.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'New title.',
      required: false,
    }),
    description_html: Property.LongText({
      displayName: 'Description (HTML)',
      description: 'New description, HTML allowed. Replaces the existing description.',
      required: false,
    }),
    handle: Property.ShortText({
      displayName: 'Handle',
      description: 'New URL handle.',
      required: false,
    }),
    redirect_new_handle: shopifyProps.booleanChoice({
      displayName: 'Redirect Old Handle',
      description: 'When changing the handle, create a redirect from the old URL. Leave empty for the Shopify default.',
    }),
    sort_order: shopifyProps.collectionSortOrder(),
    template_suffix: Property.ShortText({
      displayName: 'Template Suffix',
      description: 'New theme template suffix.',
      required: false,
    }),
    image_url: Property.ShortText({
      displayName: 'Image URL',
      description: 'Public URL of a new collection image.',
      required: false,
    }),
    image_alt: Property.ShortText({
      displayName: 'Image Alt Text',
      description: 'Alt text for the new image. Only used together with an image URL.',
      required: false,
    }),
    seo_title: Property.ShortText({
      displayName: 'SEO Title',
      description: 'New page title for search engines.',
      required: false,
    }),
    seo_description: Property.LongText({
      displayName: 'SEO Description',
      description: 'New meta description for search engines.',
      required: false,
    }),
    source_id: Property.ShortText({
      displayName: 'Conditions Source ID',
      description: 'The conditions source to edit (from get_collection sources). Required for the condition fields below.',
      required: false,
    }),
    match_type: Property.StaticDropdown({
      displayName: 'Match',
      description: 'Switch the source between matching all conditions or any of them.',
      required: false,
      options: {
        options: [
          { label: 'All conditions', value: 'ALL' },
          { label: 'Any condition', value: 'ANY' },
        ],
      },
    }),
    conditions_to_add: shopifyProps.conditions({
      required: false,
      description: 'New conditions to add to the source. Existing conditions are kept.',
    }),
    condition_ids_to_delete: Property.Array({
      displayName: 'Condition IDs to Delete',
      description: 'Ids of conditions to remove (from get_collection sources[].conditions).',
      required: false,
    }),
    currency: Property.ShortText({
      displayName: 'Currency',
      description: 'Shop currency code for new price conditions, for example "USD".',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const conditionsToCreate = shopifyValues.buildConditions({
      value: propsValue.conditions_to_add,
      currency: shopifyValues.nonEmpty(propsValue.currency)?.toUpperCase(),
    });
    const conditionsToDelete = shopifyValues.readStringList(propsValue.condition_ids_to_delete) ?? [];
    const inclusion = shopifyValues.compact({
      matchType: propsValue.match_type,
      conditionsToCreate: conditionsToCreate.length > 0 ? conditionsToCreate : undefined,
      conditionsToDelete: conditionsToDelete.length > 0 ? conditionsToDelete : undefined,
    });
    const sourceId = shopifyValues.nonEmpty(propsValue.source_id);
    if (Object.keys(inclusion).length > 0 && !sourceId) {
      throw new Error('Set source_id (from get_collection sources) to change conditions or the match type.');
    }
    const imageUrl = shopifyValues.nonEmpty(propsValue.image_url);
    const patch = shopifyValues.compact({
      title: shopifyValues.nonEmpty(propsValue.title),
      descriptionHtml: shopifyValues.nonEmpty(propsValue.description_html),
      handle: shopifyValues.nonEmpty(propsValue.handle),
      redirectNewHandle: shopifyValues.toBooleanChoice(propsValue.redirect_new_handle),
      sortOrder: propsValue.sort_order,
      templateSuffix: shopifyValues.nonEmpty(propsValue.template_suffix),
      image: imageUrl
        ? shopifyValues.compact({ src: imageUrl, altText: shopifyValues.nonEmpty(propsValue.image_alt) })
        : undefined,
      seo: shopifyValues.toSeo({ title: propsValue.seo_title, description: propsValue.seo_description }),
      sourcesToUpdate:
        sourceId && Object.keys(inclusion).length > 0
          ? [{ condition: { id: sourceId, inclusion } }]
          : undefined,
    });
    if (Object.keys(patch).length === 0) {
      throw new Error('Provide at least one field to update.');
    }
    const id = shopifyGraphqlClient.toGid({ type: 'Collection', id: propsValue.collection_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      collectionUpdate: { collection: GqlCollection | null; job: GqlJob | null } | null;
    }>({
      auth,
      query: `mutation UpdateCollection($collection: CollectionUpdateInput!) { collectionUpdate(collection: $collection) { collection { ${shopifyFields.COLLECTION_FIELDS} } job { id done } userErrors { field message } } }`,
      variables: { collection: { id, ...patch } },
    });
    const collection = data.collectionUpdate?.collection;
    if (!collection) {
      throw new Error(`Collection ${id} was not returned by Shopify.`);
    }
    return {
      ...shopifyMappers.mapCollection(collection),
      job_id: data.collectionUpdate?.job?.id ?? null,
      job_done: data.collectionUpdate?.job?.done ?? null,
      redacted_fields: redactedFields,
    };
  },
});
