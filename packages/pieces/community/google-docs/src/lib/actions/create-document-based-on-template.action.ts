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
      description: 'Dont include the "[[]]", only the key name and its value',
      required: true,
    }),
    images: Property.Object({
      displayName: 'Images',
      description:
        'Key: Image ID (get it manually from the Read File Action), Value: Image URL',
      required: true,
    }),
  },
  async run(context) {
    const documentId: string = context.propsValue.template;
    const values = context.propsValue.values;

    const authClient = new OAuth2Client();
    authClient.setCredentials(context.auth);
    const docs = google.docs('v1');

    const requests = [];

    for (const key in values) {
      const value = values[key];
      requests.push({
        replaceAllText: {
          containsText: {
            text: '[[' + key + ']]',
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
