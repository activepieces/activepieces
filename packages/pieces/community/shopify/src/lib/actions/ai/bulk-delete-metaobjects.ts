import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { GqlJob, shopifyGraphqlClient, shopifyValues } from '../../common/graphql';
import { bulkDeleteMetaobjectsOutputSchema } from '../../output-schemas/content';

const MAX_IDS = 250;

export const shopifyAiBulkDeleteMetaobjects = createAction({
  auth: shopifyAuth,
  name: 'bulk_delete_metaobjects',
  classification: 'DESTRUCTIVE',
  displayName: 'Bulk Delete Metaobject Entries',
  description: 'Start deleting many metaobject entries: listed ids, or every entry of one type.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Starts a background job that permanently deletes metaobject entries and their metafields, and returns only the job; poll get_job with job_id until done is true. scope decides what goes: BY_IDS deletes the listed entry ids (1 to 250); ALL_OF_TYPE deletes EVERY entry of the given type (the type definition itself stays). Cannot be undone. Each call starts a new job, so do not repeat it while the first job runs. Needs the write_metaobjects access scope.',
    idempotent: false,
  },
  outputSchema: bulkDeleteMetaobjectsOutputSchema,
  props: {
    scope: Property.StaticDropdown({
      displayName: 'Delete Scope',
      description: 'BY_IDS deletes only the listed entries; ALL_OF_TYPE deletes every entry of the type.',
      required: true,
      options: {
        options: [
          { label: 'Only the listed entry ids', value: 'BY_IDS' },
          { label: 'Every entry of the type', value: 'ALL_OF_TYPE' },
        ],
      },
    }),
    metaobject_ids: Property.Array({
      displayName: 'Metaobject IDs',
      description: 'For BY_IDS: entry ids, numeric or "gid://shopify/Metaobject/…", 1 to 250.',
      required: false,
    }),
    type: Property.ShortText({
      displayName: 'Metaobject Type',
      description: 'For ALL_OF_TYPE: the metaobject type whose entries are all deleted, for example "designer".',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const ids = shopifyValues.toGidList({ type: 'Metaobject', value: propsValue.metaobject_ids }) ?? [];
    const type = shopifyValues.nonEmpty(propsValue.type);
    const where = buildWhere({ scope: propsValue.scope, ids: [...new Set(ids)], type });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      metaobjectBulkDelete: { job?: GqlJob | null } | null;
    }>({
      auth,
      query: `mutation BulkDeleteMetaobjects($where: MetaobjectBulkDeleteWhereCondition!) { metaobjectBulkDelete(where: $where) { job { id done } userErrors { field message code } } }`,
      variables: { where },
    });
    return {
      job_id: data.metaobjectBulkDelete?.job?.id ?? null,
      done: data.metaobjectBulkDelete?.job?.done ?? null,
      scope: propsValue.scope,
      redacted_fields: redactedFields,
    };
  },
});

function buildWhere({
  scope,
  ids,
  type,
}: {
  scope: string;
  ids: string[];
  type: string | undefined;
}): { ids: string[] } | { type: string } {
  if (scope === 'BY_IDS') {
    if (type) {
      throw new Error('scope BY_IDS takes metaobject_ids only; remove type. Nothing was deleted.');
    }
    if (ids.length === 0) {
      throw new Error('scope BY_IDS needs at least one metaobject id. Nothing was deleted.');
    }
    if (ids.length > MAX_IDS) {
      throw new Error(`At most ${MAX_IDS} ids per call; split them over several calls. Nothing was deleted.`);
    }
    return { ids };
  }
  if (scope === 'ALL_OF_TYPE') {
    if (ids.length > 0) {
      throw new Error('scope ALL_OF_TYPE takes a type only; remove metaobject_ids. Nothing was deleted.');
    }
    if (!type) {
      throw new Error('scope ALL_OF_TYPE needs the metaobject type. Nothing was deleted.');
    }
    return { type };
  }
  throw new Error('scope must be BY_IDS or ALL_OF_TYPE. Nothing was deleted.');
}
