/* eslint-disable @typescript-eslint/no-explicit-any */
import { googleDocsAuth, createGoogleClient } from '../auth';
import { Property, createAction } from '@activepieces/pieces-framework';
import { docs as googleDocs } from '@googleapis/docs';
import { editTemplateActionOutputSchema } from '../output-schemas';
import { documentIdProp } from '../common/props';
import { toImageReplacements } from '../common/image-replacements';

const PLACEHOLDER_FORMATS: Record<string, string> = {
  'curly_braces': '{{KEY}}',
  'square_brackets': '[[KEY]]',
  'single_curly': '{KEY}',
  'single_square': '[KEY]',
  '{{KEY}}': '{{KEY}}',
  '[[KEY]]': '[[KEY]]',
  '{KEY}': '{KEY}',
  '[KEY]': '[KEY]',
};

export const createDocumentBasedOnTemplate = createAction({
  auth: googleDocsAuth,
  name: 'create_document_based_on_template',
  classification: 'WRITE',
  description:
    'Fill a template by replacing its placeholders with your values.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fills a Google Docs template in place by find-and-replacing placeholder tokens (e.g. [[KEY]] or {{KEY}}) with supplied key/value pairs and swapping placeholder images by object ID. Use when an agent has an existing template document and wants to merge data into it rather than build a doc from scratch. Requires the target document ID and the matching placeholder format; idempotent since re-running with the same values replaces no remaining placeholders and leaves the document unchanged.',
    idempotent: true,
  },
  displayName: 'Edit Template File',
  props: {
    template: documentIdProp({
      description: 'Placeholders in this document are replaced in place.',
    }),
    placeholder_format: Property.StaticDropdown({
      displayName: 'Placeholder Format',
      required: true,
      defaultValue: 'square_brackets',
      display: 'cards',
      options: {
        options: [
          { label: '{{KEY}}', value: 'curly_braces', description: 'Double curly braces' },
          { label: '[[KEY]]', value: 'square_brackets', description: 'Double square brackets' },
          { label: '{KEY}', value: 'single_curly', description: 'Single curly braces' },
          { label: '[KEY]', value: 'single_square', description: 'Single square brackets' },
        ],
      },
    }),
    values: Property.Object({
      displayName: 'Variables',
      description: 'Key names without brackets. Each value replaces its placeholder.',
      required: true,
    }),
    images: Property.Array({
      displayName: 'Image Replacements',
      description: 'Each row swaps one image in the document for a new one.',
      required: false,
      advanced: true,
      properties: {
        imageObjectId: Property.ShortText({
          displayName: 'Image Object ID',
          description: 'Found under inlineObjects in the Read Document output.',
          required: true,
          placeholder: 'kix.abc123def456',
        }),
        url: Property.ShortText({
          displayName: 'New Image URL',
          required: true,
          placeholder: 'https://example.com/logo.png',
        }),
      },
    }),
  },
  outputSchema: editTemplateActionOutputSchema,
  async run(context) {
    const documentId: string = context.propsValue.template;
    const values = context.propsValue.values;
    const placeholderType = context.propsValue.placeholder_format;
    const placeholder_format = PLACEHOLDER_FORMATS[placeholderType] || '[[KEY]]';

    const authClient = await createGoogleClient(context.auth);
    const docs = googleDocs('v1');

    const requests = [];

    for (const key in values) {
      const value = values[key];
      const new_key = placeholder_format.replace('KEY', key);

      requests.push({
        replaceAllText: {
          containsText: {
            text: new_key,
            matchCase: true,
          },
          replaceText: String(value),
        },
      });
    }

    for (const { imageObjectId, url } of toImageReplacements(context.propsValue.images)) {
      requests.push({
        replaceImage: {
          imageObjectId,
          uri: url,
        },
      });
    }

    const res = await docs.documents.batchUpdate({
      auth: authClient,
      documentId,
      requestBody: {
        requests: requests,
      },
    });

    return res;
  },
});
