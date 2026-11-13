import { createAction, Property } from '@activepieces/pieces-framework';
import {
  BedrockSessionContentBlock,
  ImageFormat,
  ImageSource,
  PutInvocationStepCommand,
} from '@aws-sdk/client-bedrock-agent-runtime';
import { awsBedrockCombinedAuth } from '../../../auth';
import { bedrockAi } from '../common';
import { amazonBedrockPutSessionInvocationStepOutputSchema } from '../../../output-schemas';

export const amazonBedrockPutSessionInvocationStep = createAction({
  auth: awsBedrockCombinedAuth,
  name: 'amazon_bedrock_put_session_invocation_step',
  outputSchema: amazonBedrockPutSessionInvocationStepOutputSchema,
  displayName: 'Put Session Invocation Step',
  description: 'Stores a step of text and images in a Bedrock session invocation.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Stores one step (text and/or images) in an invocation of an ACTIVE Amazon Bedrock session; takes the sessionId from Create Session or List Sessions and the invocationId from Create Session Invocation or List Session Invocations. Set Text for a plain text step; at least one of Text and Content Blocks is required. Not idempotent: without an Invocation Step ID each call adds a new step.',
    idempotent: false,
  },
  props: {
    sessionId: Property.ShortText({
      displayName: 'Session ID',
      description: 'The sessionId or sessionArn returned by Create Session or List Sessions.',
      required: true,
    }),
    invocationId: Property.ShortText({
      displayName: 'Invocation ID',
      description: 'The invocationId returned by Create Session Invocation or List Session Invocations.',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text to store as this step. Sent as the first content block.',
      required: false,
    }),
    contentBlocks: Property.Json({
      displayName: 'Content Blocks',
      description:
        'Advanced: more content blocks as a JSON array, sent after Text. Each is {"text": "..."} or {"image": {"format": "png" | "jpeg" | "gif" | "webp", "source": {"s3Location": {"uri": "s3://bucket/key"}}}}; use {"bytes": "<base64>"} as the source for inline images.',
      required: false,
    }),
    invocationStepTime: Property.DateTime({
      displayName: 'Step Time',
      description: 'When the step happened. Defaults to now.',
      required: false,
    }),
    invocationStepId: Property.ShortText({
      displayName: 'Invocation Step ID',
      description: 'A UUID to use as the step id. Leave empty to let Bedrock generate one.',
      required: false,
    }),
  },
  async run({ auth, propsValue, server }) {
    const extraBlocks = parseContentBlocks({ value: propsValue.contentBlocks });
    const blocks = propsValue.text ? [{ text: propsValue.text }, ...extraBlocks] : extraBlocks;
    if (blocks.length === 0) {
      throw new Error('Set Text or Content Blocks: a step needs at least one content block.');
    }
    const client = await bedrockAi.agentRuntime({ auth: auth.props, server });
    const response = await client.send(
      new PutInvocationStepCommand({
        sessionIdentifier: propsValue.sessionId,
        invocationIdentifier: propsValue.invocationId,
        invocationStepTime: propsValue.invocationStepTime ? new Date(propsValue.invocationStepTime) : new Date(),
        invocationStepId: propsValue.invocationStepId || undefined,
        payload: { contentBlocks: blocks },
      }),
    );
    return bedrockAi.body(response);
  },
});

function parseContentBlocks({ value }: { value: unknown }): BedrockSessionContentBlock[] {
  if (value === undefined || value === null || value === '') {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new Error('Content Blocks must be a JSON array, e.g. [{"text": "..."}].');
  }
  return value.map((block, index) => parseContentBlock({ block, index }));
}

function parseContentBlock({ block, index }: { block: unknown; index: number }): BedrockSessionContentBlock {
  if (isRecord(block) && typeof block['text'] === 'string') {
    return { text: block['text'] };
  }
  const image = isRecord(block) ? block['image'] : undefined;
  if (isRecord(image)) {
    const format = image['format'];
    return {
      image: {
        format: bedrockAi.enumValue({
          value: typeof format === 'string' ? format : undefined,
          allowed: ImageFormat,
          prop: `Content Blocks[${index}].image.format`,
        }),
        source: parseImageSource({ source: image['source'], index }),
      },
    };
  }
  throw new Error(`Content Blocks[${index}] must be {"text": "..."} or {"image": {"format": "...", "source": {...}}}.`);
}

function parseImageSource({ source, index }: { source: unknown; index: number }): ImageSource {
  const s3Location = isRecord(source) ? source['s3Location'] : undefined;
  if (isRecord(s3Location) && typeof s3Location['uri'] === 'string') {
    return { s3Location: { uri: s3Location['uri'] } };
  }
  const bytes = isRecord(source) ? source['bytes'] : undefined;
  if (typeof bytes === 'string') {
    return { bytes: Buffer.from(bytes, 'base64') };
  }
  throw new Error(
    `Content Blocks[${index}].image.source must be {"s3Location": {"uri": "s3://bucket/key"}} or {"bytes": "<base64>"}.`,
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
