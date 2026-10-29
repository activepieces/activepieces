import { Property } from '@activepieces/pieces-framework';
import { amazonSqsAuth } from '../auth';
import { createSqsClient, loadSqs, isAccessDenied } from './client';

export const queueUrlDropdown = Property.Dropdown({
  auth: amazonSqsAuth,
  displayName: 'Queue',
  description:
    'The queue to use. If your access key cannot list queues, leave this empty and fill "Queue URL (manual)" instead.',
  required: false,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        placeholder: 'Connect your account first',
        options: [],
      };
    }
    try {
      const sqs = await loadSqs();
      const client = await createSqsClient({ auth: auth.props });
      const urls: string[] = [];
      let nextToken: string | undefined;
      do {
        const response = await client.send(
          new sqs.ListQueuesCommand({ MaxResults: 1000, NextToken: nextToken })
        );
        urls.push(...(response.QueueUrls ?? []));
        nextToken = response.NextToken;
      } while (nextToken && urls.length < MAX_DROPDOWN_QUEUES);
      return {
        disabled: false,
        placeholder: urls.length === 0 ? 'No queues found in this region' : undefined,
        options: urls.map((url) => ({
          label: url.substring(url.lastIndexOf('/') + 1),
          value: url,
        })),
      };
    } catch (e) {
      return {
        disabled: true,
        placeholder: isAccessDenied(e)
          ? 'This key cannot list queues. Enter the queue URL in "Queue URL (manual)".'
          : `Could not load queues: ${e instanceof Error ? e.message : 'unknown error'}`,
        options: [],
      };
    }
  },
});

export const manualQueueUrlProp = Property.ShortText({
  displayName: 'Queue URL (manual)',
  description:
    'Full queue URL, e.g. https://sqs.us-east-1.amazonaws.com/123456789012/my-queue. Overrides the Queue dropdown when filled.',
  required: false,
});

const MAX_DROPDOWN_QUEUES = 5000;
