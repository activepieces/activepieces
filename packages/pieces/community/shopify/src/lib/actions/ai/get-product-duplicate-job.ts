import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { GqlJob, shopifyGraphqlClient } from '../../common/graphql';
import { getProductDuplicateJobOutputSchema } from '../../output-schemas/products';

export const shopifyAiGetProductDuplicateJob = createAction({
  auth: shopifyAuth,
  name: 'get_product_duplicate_job',
  classification: 'READ',
  displayName: 'Get Product Duplicate Job',
  description: 'Check whether a product duplication job has finished.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reads the status of a product duplication job by its id, for duplication jobs started elsewhere (for example in the Shopify admin or by another app). duplicate_product does not need it: it waits and returns the copy directly, and its image copy (image_job_id) is polled with get_job. Returns done=true once Shopify has finished; call it again later while done is false. Shopify also reports done=true for a job id it does not know, so done=true alone does not prove the id was right. One status read, it never waits.',
    idempotent: true,
  },
  outputSchema: getProductDuplicateJobOutputSchema,
  props: {
    job_id: Property.ShortText({
      displayName: 'Job ID',
      description: 'The product duplicate job id, either the bare id or "gid://shopify/ProductDuplicateJob/…".',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toOpaqueGid({ type: 'ProductDuplicateJob', id: propsValue.job_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      productDuplicateJob: GqlJob | null;
    }>({
      auth,
      query: `query GetProductDuplicateJob($id: ID!) { productDuplicateJob(id: $id) { id done } }`,
      variables: { id },
    });
    return {
      id: data.productDuplicateJob?.id ?? id,
      done: data.productDuplicateJob?.done ?? false,
      redacted_fields: redactedFields,
    };
  },
});
