import { createAction } from '@activepieces/pieces-framework';
import { amazonSnsAuth } from '../auth';
import { collectPages, createSnsClient, SNS_LIST_CAP, topicNameFromArn } from '../common/client';

function mapTopics({ arns }: { arns: string[] }) {
  return arns.map((arn) => {
    const name = topicNameFromArn({ arn });
    return { topic_arn: arn, name, is_fifo: name.endsWith('.fifo') };
  });
}

export const listTopicsAction = createAction({
  auth: amazonSnsAuth,
  name: 'list_topics',
  classification: 'SEARCH',
  displayName: 'List Topics',
  description: 'Lists all topics in the connected region (up to 1000).',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists every SNS topic in the connected account and region, returning each topic ARN, name and whether it is FIFO. Use it to find the topic ARN needed by Send Message, Get Topic, Subscribe or Delete Topic. Returns up to 1000 topics and fails rather than returning a partial list if there are more. Read-only.',
    idempotent: true,
  },
  props: {},
  outputSchema: {
    fields: [
      {
        key: 'topics',
        label: 'Topics',
        labelKey: 'name',
        listItems: [
          { key: 'topic_arn', label: 'Topic ARN' },
          { key: 'name', label: 'Name' },
          { key: 'is_fifo', label: 'Is FIFO', format: 'boolean' },
        ],
      },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  },
  async run(context) {
    const { client, sdk } = await createSnsClient({ auth: context.auth.props });
    const { items } = await collectPages({
      operation: 'list topics',
      noun: 'topics',
      cap: SNS_LIST_CAP,
      onCap: 'throw',
      fetchPage: async (nextToken) => {
        const page = await client.send(new sdk.ListTopicsCommand({ NextToken: nextToken }));
        const arns: string[] = [];
        for (const topic of page.Topics ?? []) {
          if (topic.TopicArn) {
            arns.push(topic.TopicArn);
          }
        }
        return { items: arns, nextToken: page.NextToken };
      },
    });
    const topics = mapTopics({ arns: items });
    return { topics, count: topics.length };
  },
});

export { mapTopics };
