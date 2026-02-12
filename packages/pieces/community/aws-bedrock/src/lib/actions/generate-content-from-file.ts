import { createAction, Property } from '@activepieces/pieces-framework';
import {
  ConverseCommand,
  ConversationRole,
  DocumentFormat,
} from '@aws-sdk/client-bedrock-runtime';
import { awsBedrockAuth } from '../../index';
import {
  BedrockAuth,
  createBedrockRuntimeClient,
  getBedrockModelOptions,
} from '../common';

const EXTENSION_TO_FORMAT: Record<string, DocumentFormat> = {
  pdf: DocumentFormat.PDF,
  csv: DocumentFormat.CSV,
  doc: DocumentFormat.DOC,
  docx: DocumentFormat.DOCX,
  xls: DocumentFormat.XLS,
  xlsx: DocumentFormat.XLSX,
  html: DocumentFormat.HTML,
  txt: DocumentFormat.TXT,
  md: DocumentFormat.MD,
};

export const generateContentFromFile = createAction({
  auth: awsBedrockAuth,
  name: 'generate_content_from_file',
  displayName: 'Generate Content from File',
  description:
    'Send a document to a Bedrock model and ask questions about it.',
  props: {
    model: Property.Dropdown({
      displayName: 'Model',
      required: true,
      description:
        'The foundation model to use. Must support document input.',
      refreshers: [],
      auth: awsBedrockAuth,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your AWS account first',
            options: [],
          };
        }
        return getBedrockModelOptions(auth.props);
      },
    }),
    file: Property.File({
      displayName: 'File',
      required: true,
      description:
        'The document to analyze (PDF, CSV, DOC, DOCX, XLS, XLSX, HTML, TXT, or MD).',
    }),
    documentName: Property.ShortText({
      displayName: 'Document Name',
      required: true,
      description:
        'A short name for the document (letters, numbers, hyphens, spaces).',
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      required: true,
      description: 'What do you want the model to tell you about the document?',
    }),
    systemPrompt: Property.LongText({
      displayName: 'System Prompt',
      required: false,
      description: 'Instructions that guide the model behavior.',
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      required: false,
      description:
        'Controls randomness. Lower values produce more deterministic output.',
      defaultValue: 0.7,
    }),
    maxTokens: Property.Number({
      displayName: 'Maximum Tokens',
      required: false,
      description: 'The maximum number of tokens to generate.',
      defaultValue: 2048,
    }),
  },
  async run({ auth, propsValue }) {
    const client = createBedrockRuntimeClient(auth.props);
    const {
      model,
      file,
      documentName,
      prompt,
      systemPrompt,
      temperature,
      maxTokens,
    } = propsValue;

    const ext = (file.extension ?? '').toLowerCase();
    const format = EXTENSION_TO_FORMAT[ext];
    if (!format) {
      throw new Error(
        `Unsupported document format "${ext}". Supported: pdf, csv, doc, docx, xls, xlsx, html, txt, md.`
      );
    }

    const fileBytes = Buffer.from(file.base64, 'base64');

    const response = await client.send(
      new ConverseCommand({
        modelId: model,
        messages: [
          {
            role: ConversationRole.USER,
            content: [
              {
                document: {
                  format,
                  name: documentName,
                  source: { bytes: fileBytes },
                },
              },
              { text: prompt },
            ],
          },
        ],
        ...(systemPrompt ? { system: [{ text: systemPrompt }] } : {}),
        inferenceConfig: {
          temperature: temperature ?? undefined,
          maxTokens: maxTokens ?? undefined,
        },
      })
    );

    const outputMessage = response.output?.message;
    const textContent = outputMessage?.content
      ?.filter((block) => 'text' in block)
      .map((block) => block.text)
      .join('');

    return {
      text: textContent ?? '',
      stopReason: response.stopReason,
      usage: response.usage,
    };
  },
});
