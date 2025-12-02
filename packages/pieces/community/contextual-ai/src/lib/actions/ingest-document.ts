import { createAction, Property } from "@activepieces/pieces-framework";
import { contextualAiAuth } from "../../index";
import { ContextualAI, toFile } from 'contextual-client';
import type { Datastore } from 'contextual-client/resources/datastores';

export const ingestDocumentAction = createAction({
  auth: contextualAiAuth,
  name: 'ingest_document',
  displayName: 'Ingest Document',
  description: 'Upload and ingest a document into a Contextual AI datastore',
  props: {
    datastoreId: Property.Dropdown({
      auth: contextualAiAuth,
      displayName: 'Datastore',
      description: 'Select the datastore to upload the document to',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        try {
          if (!auth) {
            return {
              disabled: true,
              options: [],
              placeholder: 'Please connect your account first',
            };
          }
          const { apiKey, baseUrl } = auth.props;
          const client = new ContextualAI({
            apiKey: apiKey,
            baseURL: baseUrl || 'https://api.contextual.ai/v1',
          });

          const allDatastores: Datastore[] = [];
          for await (const datastore of client.datastores.list()) {
            allDatastores.push(datastore);
          }

          return {
            options: allDatastores.map((datastore: Datastore) => ({
              label: datastore.name,
              value: datastore.id,
            })),
          };
        } catch (error) {
          return {
            options: [],
            error: 'Failed to fetch datastores. Please check your API key.',
          };
        }
      },
    }),
    file: Property.File({
      displayName: 'Document File',
      description: 'The document file to upload (PDF, HTML, DOC, DOCX, PPT, PPTX)',
      required: true,
    }),
    customMetadata: Property.Object({
      displayName: 'Custom Metadata',
      description: 'Optional custom metadata as key-value pairs (max 15 fields, 2KB total)',
      required: false,
    }),
    configuration: Property.LongText({
      displayName: 'Configuration Override',
      description: 'Optional configuration override in JSON format for this specific document',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { apiKey, baseUrl } = auth.props;
    const { datastoreId, file, customMetadata, configuration } = propsValue;

    const client = new ContextualAI({
      apiKey: apiKey,
      baseURL: baseUrl || 'https://api.contextual.ai/v1',
    });

    let metadataString: string | undefined;
    if (customMetadata && Object.keys(customMetadata).length > 0) {
      metadataString = JSON.stringify({
        custom_metadata: customMetadata,
      });
    }

    const uploadableFile = await toFile(file.data, file.filename || 'uploaded-file', {
      type: file.extension ? `application/${file.extension}` : 'application/octet-stream',
    });

    const fileData = {
      file: uploadableFile,
      custom_metadata: metadataString,
      configuration: configuration,
    };

    const response = await client.datastores.documents.ingest(datastoreId, fileData);

    return {
      document_id: response.id,
      status: 'Document ingestion started. Use the document ID to check status.',
    };
  },
});
