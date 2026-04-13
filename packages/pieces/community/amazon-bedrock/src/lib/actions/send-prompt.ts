import {
  createAction,
  DynamicPropsValue,
  Property,
  StoreScope,
} from '@activepieces/pieces-framework';
import {
  ContentBlock,
  ConverseCommand,
  ConversationRole,
  Message,
} from '@aws-sdk/client-bedrock-runtime';
import { awsBedrockAuth } from '../auth';
import {
  buildFileContentBlock,
  buildS3ContentBlock,
  createBedrockRuntimeClient,
  getBedrockModelOptions,
  formatBedrockError,
  extractConverseTextResponse,
} from '../common';

export const sendPrompt = createAction({
  auth: awsBedrockAuth,
  name: 'send_prompt',
  displayName: 'Ask Bedrock',
  description: 'Send a text prompt to an Amazon Bedrock model.',
  props: {
    model: Property.Dropdown({
      displayName: 'Model',
      required: true,
      auth: awsBedrockAuth,
      description: 'The foundation model to use for generation.',
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your AWS account first',
            options: [],
          };
        }
        return getBedrockModelOptions(auth.props, { useInferenceProfiles: true });
      },
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'The message or question to send to the model.',
      required: true,
    }),
    systemPrompt: Property.LongText({
      displayName: 'System Prompt',
      required: false,
      description: 'Instructions that set the model\'s behavior and persona (e.g. "You are a helpful assistant that replies concisely.").',
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      required: false,
      description:
        'Controls how creative or predictable the response is. Lower values (e.g. 0.2) give focused, consistent answers. Higher values (e.g. 0.9) give more varied, creative output.',
      defaultValue: 0.7,
    }),
    maxTokens: Property.Number({
      displayName: 'Maximum Tokens',
      required: false,
      description: 'The maximum length of the response. One token is roughly 4 characters. 2048 tokens ≈ ~1500 words.',
      defaultValue: 2048,
    }),
    topP: Property.Number({
      displayName: 'Top P',
      required: false,
      description:
        'Limits the pool of words the model picks from (0–1). Lower values make responses more focused. Leave at 1 to disable this filter and use Temperature instead.',
      defaultValue: 1,
    }),
    stopSequences: Property.Array({
      displayName: 'Stop Sequences',
      required: false,
      description:
        'Text strings that, when generated, cause the model to stop immediately (e.g. "END" or "\\n\\n"). Up to 4 sequences.',
    }),
    memoryKey: Property.ShortText({
      displayName: 'Conversation Memory ID',
      required: false,
      description:
        'A unique name for this conversation\'s memory (e.g. "support-chat-user-123"). When set, the model remembers previous messages in this flow. Leave empty for a single-turn interaction with no memory.',
    }),
    attachmentSource: Property.StaticDropdown({
      displayName: 'Attachment Source (Optional)',
      description: 'Optionally include a file alongside your prompt. Choose whether to upload directly or reference one from S3.',
      required: false,
      options: {
        options: [
          { label: 'Upload a file', value: 'file' },
          { label: 'From S3 bucket', value: 's3' },
        ],
      },
    }),
    attachment: Property.DynamicProperties({
      auth: awsBedrockAuth,
      displayName: 'Attachment',
      required: false,
      refreshers: ['attachmentSource'],
      props: async ({ attachmentSource }): Promise<DynamicPropsValue> => {
        if (attachmentSource === 'file') {
          return {
            file: Property.File({
              displayName: 'File',
              description: 'Supported: images (png, jpg, gif, webp), documents (pdf, csv, doc, docx, xls, xlsx, html, txt, md), videos (mp4, mov, mkv, etc.), audio (mp3, wav, aac, flac, etc.). Not all models support all file types.',
              required: true,
            }),
          };
        }
        if (attachmentSource === 's3') {
          return {
            s3Bucket: Property.ShortText({
              displayName: 'S3 Bucket',
              description: 'The name of your S3 bucket containing the file.',
              required: true,
            }),
            s3Key: Property.ShortText({
              displayName: 'S3 File Path',
              description: 'The path to the file in your S3 bucket (e.g. "documents/report.pdf"). The file extension determines the media type sent to the model.',
              required: true,
            }),
          };
        }
        return {};
      },
    }),
  },
  async run({ auth, propsValue, store }) {
    const client = createBedrockRuntimeClient(auth.props);
    const {
      model,
      prompt,
      systemPrompt,
      temperature,
      maxTokens,
      topP,
      stopSequences,
      memoryKey,
      attachmentSource,
      attachment,
    } = propsValue;

    let messageHistory: Message[] = [];
    if (memoryKey) {
      messageHistory =
        (await store.get<Message[]>(memoryKey, StoreScope.PROJECT)) ?? [];
    }

    const userContent: ContentBlock[] = [{ text: prompt }];
    if (attachmentSource === 'file' && attachment?.['file']) {
      userContent.push(buildFileContentBlock(attachment['file']));
    } else if (attachmentSource === 's3' && attachment?.['s3Bucket'] && attachment?.['s3Key']) {
      userContent.push(buildS3ContentBlock(attachment['s3Bucket'] as string, attachment['s3Key'] as string));
    }

    messageHistory.push({
      role: ConversationRole.USER,
      content: userContent,
    });

    try {
      const response = await client.send(
        new ConverseCommand({
          modelId: model,
          messages: messageHistory,
          ...(systemPrompt ? { system: [{ text: systemPrompt }] } : {}),
          inferenceConfig: {
            temperature: temperature ?? undefined,
            maxTokens: maxTokens ?? undefined,
            topP: topP ?? undefined,
            stopSequences:
              stopSequences && stopSequences.length > 0
                ? (stopSequences as string[])
                : undefined,
          },
        })
      );

      const outputMessage = response.output?.message;
      if (outputMessage) {
        messageHistory.push(outputMessage);
      }

      if (memoryKey) {
        await store.put(memoryKey, messageHistory, StoreScope.PROJECT);
      }

      return extractConverseTextResponse(response);
    } catch (error) {
      throw new Error(formatBedrockError(error));
    }
  },
});
