import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient, shopifyValues } from '../../common/graphql';
import { deleteAnalyticsTargetsOutputSchema } from '../../output-schemas/analytics';

const NOT_FOUND_CODE = 'NOT_FOUND';

export const shopifyAiDeleteAnalyticsTargets = createAction({
  auth: shopifyAuth,
  name: 'delete_analytics_targets',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Analytics Targets',
  description: 'Permanently delete one or more analytics targets.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes one or more analytics targets (merchant goals shown in Shopify Analytics). There is no undo; recreating one with create_analytics_target gives it a new id. Confirm with the user first and name the targets (name, metric, period) being removed. Get the ids from list_analytics_targets. Shopify deletes every id it finds even when others are not found: deleted_ids lists what was removed, not_deleted_ids and errors list the rest (for example NOT_FOUND because it was already deleted). The step fails only when nothing at all was deleted. A repeat call reports the ids as not found. Needs the write_reports access scope.',
    idempotent: false,
  },
  props: {
    target_ids: Property.Array({
      displayName: 'Analytics Target IDs',
      description: 'Targets to delete, numeric or "gid://shopify/AnalyticsTarget/…". Find them with list_analytics_targets.',
      required: true,
    }),
  },
  outputSchema: deleteAnalyticsTargetsOutputSchema,
  async run({ auth, propsValue }) {
    const ids = shopifyValues.toGidList({ type: 'AnalyticsTarget', value: propsValue.target_ids });
    if (!ids) {
      throw new Error('Provide at least one analytics target id. Nothing was deleted.');
    }
    const uniqueIds = [...new Set(ids)];
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      analyticsTargetsDelete: {
        deletedIds?: string[] | null;
        userErrors?: { field?: string[] | null; message?: string | null; code?: string | null }[] | null;
      } | null;
    }>({
      auth,
      query: `mutation DeleteAnalyticsTargets($ids: [ID!]!) { analyticsTargetsDelete(ids: $ids) { deletedIds userErrors { field message code } } }`,
      variables: { ids: uniqueIds },
      toleratedUserErrorCodes: [NOT_FOUND_CODE],
    });
    const deletedIds = data.analyticsTargetsDelete?.deletedIds ?? [];
    const deleted = new Set(deletedIds);
    const notDeletedIds = uniqueIds.filter((id) => !deleted.has(id));
    const errors = (data.analyticsTargetsDelete?.userErrors ?? []).map((item) => {
      const field = (item.field ?? []).join('.');
      const code = item.code ? ` (${item.code})` : '';
      return `${field ? `${field}: ` : ''}${item.message ?? 'Unknown error'}${code}`;
    });
    if (deletedIds.length === 0) {
      throw new Error(
        `No analytics target was deleted. ${errors.length > 0 ? `Shopify said: ${errors.join('; ')}` : 'Shopify returned no deleted ids.'} Check the ids with list_analytics_targets.`
      );
    }
    return {
      deleted_ids: deletedIds,
      deleted_count: deletedIds.length,
      not_deleted_ids: notDeletedIds,
      errors,
      redacted_fields: redactedFields,
    };
  },
});
