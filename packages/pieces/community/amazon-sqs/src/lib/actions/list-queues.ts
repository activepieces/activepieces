import { createAction, Property } from '@activepieces/pieces-framework';
import { amazonSqsAuth } from '../auth';
import { createSqsClient, loadSqs, parseOptionalInt } from '../common/client';
import { listQueuesOutputSchema } from '../output-schemas';

export const listQueues = createAction({
  name: 'list_queues',
  classification: 'SEARCH',
  displayName: 'List Queues',
  auth: amazonSqsAuth,
  description: 'Lists queues in the connection region, optionally filtered by name prefix.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists Amazon SQS queues in the connection region, optionally only those whose name starts with a prefix. Returns queue names and full URLs (use a URL as the queue for other actions), up to the max results; "truncated" is true when more queues exist. Read-only. Requires sqs:ListQueues permission.',
    idempotent: true,
  },
  outputSchema: listQueuesOutputSchema,
  props: {
    queueNamePrefix: Property.ShortText({
      displayName: 'Queue Name Prefix',
      description: 'Only return queues whose name starts with this text (case-sensitive).',
      required: false,
    }),
    maxResults: Property.Number({
      displayName: 'Max Results',
      description: '1-5000. Defaults to 1000.',
      required: false,
      defaultValue: 1000,
    }),
  },
  async run({ propsValue, auth }) {
    const cap = parseOptionalInt({ value: propsValue.maxResults, name: 'Max Results', min: 1, max: 5000 }) ?? 1000;
    const prefix = propsValue.queueNamePrefix?.trim() || undefined;
    const sqs = await loadSqs();
    const client = await createSqsClient({ auth: auth.props });
    const urls: string[] = [];
    let nextToken: string | undefined;
    let truncated = false;
    do {
      const response = await client.send(
        new sqs.ListQueuesCommand({
          QueueNamePrefix: prefix,
          MaxResults: Math.min(1000, cap - urls.length),
          NextToken: nextToken,
        })
      );
      urls.push(...(response.QueueUrls ?? []));
      nextToken = response.NextToken;
      if (urls.length >= cap) {
        truncated = urls.length > cap || nextToken !== undefined;
        break;
      }
    } while (nextToken);
    const queues = urls.slice(0, cap).map((url) => ({
      name: url.substring(url.lastIndexOf('/') + 1),
      url,
    }));
    return { queues, count: queues.length, truncated };
  },
});
