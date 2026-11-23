import { createAction, isNil, Property } from '@activepieces/pieces-framework';
import { amazonSnsAuth } from '../auth';
import { callSns, createSnsClient } from '../common/client';
import { yesNoOptions } from '../common/props';

function validateTopicName({ name, fifo }: { name: string; fifo: boolean }): void {
  if (!/^[A-Za-z0-9_-]{1,256}(\.fifo)?$/.test(name) || name.length > 256) {
    throw new Error(
      'Topic name must be 1-256 characters of letters, digits, hyphens or underscores (FIFO names end in ".fifo").'
    );
  }
  if (fifo && !name.endsWith('.fifo')) {
    throw new Error('FIFO topic names must end in ".fifo". Add the suffix or set FIFO Topic to No.');
  }
  if (!fifo && name.endsWith('.fifo')) {
    throw new Error('Only FIFO topics can end in ".fifo". Set FIFO Topic to Yes or remove the suffix.');
  }
}

function buildTopicAttributes({
  fifo,
  contentBasedDeduplication,
  displayName,
}: {
  fifo: boolean;
  contentBasedDeduplication: boolean;
  displayName: string | undefined;
}): Record<string, string> {
  if (contentBasedDeduplication && !fifo) {
    throw new Error('Content-based deduplication is only available for FIFO topics.');
  }
  const attributes: Record<string, string> = {};
  if (fifo) {
    attributes['FifoTopic'] = 'true';
  }
  if (contentBasedDeduplication) {
    attributes['ContentBasedDeduplication'] = 'true';
  }
  if (!isNil(displayName) && displayName !== '') {
    attributes['DisplayName'] = displayName;
  }
  return attributes;
}

export const createTopicAction = createAction({
  auth: amazonSnsAuth,
  name: 'create_topic',
  classification: 'WRITE',
  displayName: 'Create Topic',
  description: 'Creates a standard or FIFO topic. Returns the existing topic if one with the same name and settings already exists.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates an SNS topic and returns its ARN. FIFO topics need a name ending in ".fifo" and keep strict ordering; content-based deduplication only applies to FIFO. Idempotent: creating a topic with an existing name and the same settings returns the existing ARN; different settings for an existing name fail.',
    idempotent: true,
  },
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Letters, digits, hyphens and underscores, up to 256 characters. FIFO topic names must end in ".fifo".',
      required: true,
    }),
    fifo: Property.StaticDropdown<string, true>({
      displayName: 'FIFO Topic',
      description: 'Yes for a FIFO topic (strict ordering and deduplication).',
      required: true,
      defaultValue: 'no',
      options: yesNoOptions,
    }),
    content_based_deduplication: Property.StaticDropdown<string, false>({
      displayName: 'Content-Based Deduplication',
      description: 'FIFO only. Yes to deduplicate by a hash of the message body, so senders need no deduplication ID.',
      required: false,
      defaultValue: 'no',
      options: yesNoOptions,
    }),
    display_name: Property.ShortText({
      displayName: 'Display Name',
      description: 'Optional sender name shown to SMS and email subscribers.',
      required: false,
    }),
  },
  outputSchema: {
    fields: [
      { key: 'topic_arn', label: 'Topic ARN' },
      { key: 'name', label: 'Name' },
      { key: 'is_fifo', label: 'Is FIFO', format: 'boolean' },
    ],
  },
  async run(context) {
    const name = context.propsValue.name.trim();
    const fifo = context.propsValue.fifo === 'yes';
    const contentBasedDeduplication = context.propsValue.content_based_deduplication === 'yes';
    validateTopicName({ name, fifo });
    const attributes = buildTopicAttributes({
      fifo,
      contentBasedDeduplication,
      displayName: context.propsValue.display_name?.trim(),
    });
    const { client, sdk } = await createSnsClient({ auth: context.auth.props });
    const response = await callSns({
      operation: 'create topic',
      call: () =>
        client.send(
          new sdk.CreateTopicCommand({
            Name: name,
            Attributes: Object.keys(attributes).length > 0 ? attributes : undefined,
          })
        ),
    });
    return {
      topic_arn: response.TopicArn ?? null,
      name,
      is_fifo: fifo,
    };
  },
});

export { validateTopicName, buildTopicAttributes };
