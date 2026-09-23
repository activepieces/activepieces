import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient, shopifyValues } from '../../common/graphql';

const DELETE_QUEUED_CODE = 'DELETE_JOB_ENQUEUED';

export const shopifyAiDeleteExternalMarketingActivity = createAction({
  auth: shopifyAuth,
  name: 'delete_external_marketing_activity',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete External Marketing Activity',
  description: 'Delete an external marketing activity.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deletes one external marketing activity, identified by exactly one of marketing_activity_id or remote_id, and returns the deleted id. Its reported engagement goes with it and cannot be restored; to keep the history and only mark it as over, use update_external_marketing_activity with an INACTIVE status instead. Shopify refuses to delete an activity that still has child events (code CANNOT_DELETE_ACTIVITY_WITH_CHILD_EVENTS). If Shopify answers that the deletion was queued (code DELETE_JOB_ENQUEUED, not yet confirmed on a store) the output says deletion_queued: true. A repeat call fails because the activity is gone. Needs the write_marketing_events access scope.',
    idempotent: false,
  },
  props: {
    marketing_activity_id: Property.ShortText({
      displayName: 'Marketing Activity ID',
      description: 'The activity id, numeric or "gid://shopify/MarketingActivity/…". Use this or the remote id.',
      required: false,
    }),
    remote_id: Property.ShortText({
      displayName: 'Remote ID',
      description: 'Your own id the activity was created with, for example "fb-campaign-2026-spring".',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const target = shopifyValues.readMarketingActivityTarget({
      marketingActivityId: propsValue.marketing_activity_id,
      remoteId: propsValue.remote_id,
    });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      marketingActivityDeleteExternal: {
        deletedMarketingActivityId?: string | null;
        userErrors?: { code?: string | null }[] | null;
      } | null;
    }>({
      auth,
      query: `mutation DeleteExternalMarketingActivity($marketingActivityId: ID, $remoteId: String) { marketingActivityDeleteExternal(marketingActivityId: $marketingActivityId, remoteId: $remoteId) { deletedMarketingActivityId userErrors { field message code } } }`,
      variables: target,
      toleratedUserErrorCodes: [DELETE_QUEUED_CODE],
    });
    const payload = data.marketingActivityDeleteExternal;
    const queued = (payload?.userErrors ?? []).some((item) => item.code === DELETE_QUEUED_CODE);
    return {
      deleted_marketing_activity_id: payload?.deletedMarketingActivityId ?? target.marketingActivityId ?? null,
      remote_id: target.remoteId ?? null,
      deletion_queued: queued,
      redacted_fields: redactedFields,
    };
  },
});
