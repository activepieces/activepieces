/* eslint-disable @typescript-eslint/no-explicit-any */
import { googleDocsAuth } from '../../index';
import { Property, createAction } from '@activepieces/pieces-framework';
import { google } from 'googleapis';
import { OAuth2Client } from 'googleapis-common';

export const createDocumentBasedOnTemplate = createAction({
  auth: googleDocsAuth,
  name: 'create_document_based_on_template',
  description:
    'Edit a template file and replace the values with the ones provided',
  displayName: 'Edit template file',
  props: {
    template: Property.ShortText({
      displayName: 'Destination File',
      description: 'The ID of the file to replace the values',
      required: true,
    }),
    values: Property.Object({
      displayName: 'Variables',
      description: 'Dont include the placeholder format "[[]]" or "{{}}", only the key name and its value',
      required: true,
    }),
    images: Property.Object({
      displayName: 'Images',
      description:
        'Key: Image ID (get it manually from the Read File Action), Value: Image URL',
      required: true,
    }),
    placeholder_format: Property.StaticDropdown({
      displayName: 'Placeholder Format',
      description: 'Choose the format of placeholders in your template',
      required: true,
      defaultValue: '[[KEY]]',
      options: {
          disabled: false,
          options: [
              { label: 'Curly Braces {{}}', value: '{{KEY}}' },
              { label: 'Square Brackets [[]]', value: '[[KEY]]' },
              { label: 'Single Curly Braces {}', value: '{KEY}' },
              { label: 'Single Square Brackets []', value: '[KEY]' }
          ],
        },
  }),
  },
  async run(context) {
    const documentId: string = context.propsValue.template;
    const values = context.propsValue.values;
    const placeholder_format = context.propsValue.placeholder_format;

    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const docs = google.docs('v1');

    const requests = [];

    // Helper function to escape special regex characters
    const escapeRegex = (str: string) => {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

    for (const key in values) {
      const value = values[key];
      // Escape special characters in placeholder_format before replacing KEY
      const escapedFormat = escapeRegex(placeholder_format);
      const new_key = escapedFormat.replace('KEY', key);

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

    for (const key in context.propsValue.images) {
      const value = context.propsValue.images[key];
      requests.push({
        replaceImage: {
          imageObjectId: key,
          uri: String(value),
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
