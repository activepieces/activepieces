import { createAction, Property } from '@activepieces/pieces-framework';
import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { ModelModality } from '@aws-sdk/client-bedrock';
import { awsBedrockAuth } from '../../index';
import {
  createBedrockRuntimeClient,
  getBedrockModelOptions,
  formatBedrockError,
} from '../common';

export const generateEmbeddings = createAction({
  auth: awsBedrockAuth,
  name: 'generate_embeddings',
  displayName: 'Generate Embeddings',
  description:
    'Generate vector embeddings from text using Amazon Titan Embed, Cohere Embed, or Amazon Nova Multimodal Embeddings models.',
  props: {
    model: Property.Dropdown({
      displayName: 'Model',
      required: true,
      auth: awsBedrockAuth,
      description: 'The embedding model to use.',
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your AWS account first',
            options: [],
          };
        }
        return getBedrockModelOptions(auth.props, {
          outputModality: ModelModality.EMBEDDING,
        });
      },
    }),
    inputText: Property.LongText({
      displayName: 'Input Text',
      required: true,
      description: 'The text to generate embeddings for.',
    }),
    embeddingPurpose: Property.StaticDropdown({
      displayName: 'Embedding Purpose',
      required: false,
      description:
        'Optimize embeddings for your use case. Only used by Nova Multimodal Embeddings.',
      defaultValue: 'GENERIC_INDEX',
      options: {
        options: [
          { label: 'Generic Index', value: 'GENERIC_INDEX' },
          { label: 'Generic Retrieval', value: 'GENERIC_RETRIEVAL' },
          { label: 'Text Retrieval', value: 'TEXT_RETRIEVAL' },
          { label: 'Classification', value: 'CLASSIFICATION' },
          { label: 'Clustering', value: 'CLUSTERING' },
        ],
      },
    }),
    dimensions: Property.Number({
      displayName: 'Dimensions',
      required: false,
      description:
        'The number of dimensions for the output embedding vector. Titan Embed v2: 256, 512, 1024. Nova Multimodal: 256, 384, 1024, 3072.',
    }),
    normalize: Property.Checkbox({
      displayName: 'Normalize',
      required: false,
      description:
        'Whether to normalize the output embedding vector. Supported by Titan Embed v2.',
      defaultValue: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = createBedrockRuntimeClient(auth.props);
    const { model, inputText, dimensions, normalize } = propsValue;

    const isTitan = model.startsWith('amazon.titan-embed');
    const isCohere = model.startsWith('cohere.embed');
    const isNova = model.includes('nova') && model.includes('embed');
    const isTwelveLabs = model.startsWith('twelvelabs.');

    let requestBody: Record<string, unknown>;

    if (isNova) {
      requestBody = {
        schemaVersion: 'nova-multimodal-embed-v1',
        taskType: 'SINGLE_EMBEDDING',
        singleEmbeddingParams: {
          embeddingPurpose: propsValue.embeddingPurpose ?? 'GENERIC_INDEX',
          ...(dimensions != null ? { embeddingDimension: dimensions } : {}),
          text: {
            truncationMode: 'END',
            value: inputText,
          },
        },
      };
    } else if (isTitan) {
      requestBody = {
        inputText,
        ...(dimensions != null ? { dimensions } : {}),
        ...(normalize != null ? { normalize } : {}),
      };
    } else if (isCohere) {
      requestBody = {
        texts: [inputText],
        input_type: 'search_document',
        truncate: 'END',
      };
    } else if (isTwelveLabs) {
      requestBody = {
        inputType: 'text',
        inputText,
        textTruncate: 'end',
      };
    } else {
      requestBody = {
        inputText,
      };
    }

    try {
      const response = await client.send(
        new InvokeModelCommand({
          modelId: model,
          body: Buffer.from(JSON.stringify(requestBody)),
          contentType: 'application/json',
          accept: 'application/json',
        })
      );

      const responseBody = JSON.parse(
        new TextDecoder().decode(response.body)
      );

      let embedding: number[] | undefined;

      if (responseBody.embedding) {
        // Titan Embed / TwelveLabs format: { embedding: [floats] }
        embedding = responseBody.embedding;
      } else if (
        responseBody.embeddings &&
        responseBody.embeddings.length > 0
      ) {
        const first = responseBody.embeddings[0];
        if (Array.isArray(first)) {
          // Cohere v3 format: { embeddings: [[floats]] }
          embedding = first;
        } else if (first?.embedding) {
          // Nova format: { embeddings: [{ embedding: [floats] }] }
          embedding = first.embedding;
        }
      }

      if (!embedding) {
        throw new Error(
          'No embedding was returned by the model. The response format may not be supported.'
        );
      }

      return {
        embedding,
        dimensions: embedding.length,
        model,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes('No embedding')) {
        throw error;
      }
      throw new Error(formatBedrockError(error));
    }
  },
});
