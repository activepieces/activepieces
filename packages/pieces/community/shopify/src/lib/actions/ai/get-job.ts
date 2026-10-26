import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient } from '../../common/graphql';
import { getJobOutputSchema } from '../../output-schemas/orders';

export const shopifyAiGetJob = createAction({
  auth: shopifyAuth,
  name: 'get_job',
  classification: 'READ',
  displayName: 'Get Job Status',
  description: 'Check whether an asynchronous Shopify job has finished.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reads the status of an asynchronous Shopify job, such as the job returned by start_order_cancellation. Returns done=true once Shopify has finished the work; call it again later while done is false. Shopify also reports done=true for an unknown job id, so pass the exact id you were given. One status read, it never waits.',
    idempotent: true,
  },
  outputSchema: getJobOutputSchema,
  props: {
    job_id: Property.ShortText({
      displayName: 'Job ID',
      description:
        'The job id returned by the start action, for example "gid://shopify/Job/dc9b2604-c73b-45c6-8942-e235bac987e8". A bare UUID such as "dc9b2604-c73b-45c6-8942-e235bac987e8" is also accepted.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = toJobGid(propsValue.job_id);
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      job: { id: string; done?: boolean | null } | null;
    }>({
      auth,
      query: `query GetJob($id: ID!) { job(id: $id) { id done } }`,
      variables: { id },
    });
    if (!data.job) {
      throw new Error(`Job ${id} was not found. Pass the job id returned by the start action.`);
    }
    return {
      id: data.job.id,
      done: data.job.done ?? false,
      redacted_fields: redactedFields,
    };
  },
});

function toJobGid(value: string): string {
  const trimmed = value.trim();
  if (UUID_PATTERN.test(trimmed)) {
    return `gid://shopify/Job/${trimmed}`;
  }
  return shopifyGraphqlClient.toGid({ type: 'Job', id: trimmed });
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
