import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient } from '../../common/graphql';
import { deleteAnalyticsAnnotationOutputSchema } from '../../output-schemas/analytics';

export const shopifyAiDeleteAnalyticsAnnotation = createAction({
  auth: shopifyAuth,
  name: 'delete_analytics_annotation',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Analytics Annotation',
  description: 'Remove an analytics annotation this app created.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes one analytics annotation, so its marker disappears from the store\'s analytics charts. Pass the id returned by create_analytics_annotation (there is no action to list annotations). Only annotations this app created can be deleted; any other id fails with NOT_FOUND. Deleting frees a slot when create_analytics_annotation answered LIMIT_REACHED. There is no undo: recreating it gives a new id. Confirm with the user first. A repeat call fails with NOT_FOUND because it is gone. Needs the write_analytics_annotations access scope.',
    idempotent: false,
  },
  props: {
    annotation_id: Property.ShortText({
      displayName: 'Analytics Annotation ID',
      description:
        'The annotation id, numeric or "gid://shopify/AnalyticsAnnotation/…", as returned by create_analytics_annotation.',
      required: true,
    }),
  },
  outputSchema: deleteAnalyticsAnnotationOutputSchema,
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'AnalyticsAnnotation', id: propsValue.annotation_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      analyticsAnnotationDelete: { deletedId?: string | null } | null;
    }>({
      auth,
      query: `mutation DeleteAnalyticsAnnotation($id: ID!) { analyticsAnnotationDelete(id: $id) { deletedId userErrors { field message code } } }`,
      variables: { id },
    });
    return {
      deleted_annotation_id: data.analyticsAnnotationDelete?.deletedId ?? id,
      redacted_fields: redactedFields,
    };
  },
});
