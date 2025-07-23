// https://docs.pdfmonkey.io/references/api/documents#sample-http-request-to-generate-a-document

import { createAction, InputPropertyMap, Property } from '@activepieces/pieces-framework';
import { pdfmonkeyAuth } from '../auth';
import { makeRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const generateDocument = createAction({
  name: 'generate_document',
  displayName: 'Generate Document',
  description: 'Create a document from a specified template and input data',
  auth: pdfmonkeyAuth,
  props: {
    templateId: Property.ShortText({
      displayName: 'Template ID',
      description: 'The ID of the template to use for generating the document',
      required: true,
    }),
    fileName: Property.ShortText({
      displayName: 'File Name',
      description: 'The name of the generated document file',
      required: false,
    }),
    data: Property.Object({
      displayName: 'Input Data',
      description: 'Input data to generate the document',
      required: false,
      defaultValue: {
        key1: 'value1',
        key2: 'value2',
      },
    }),
    outputType: Property.StaticDropdown({
      displayName: 'Output Type',
      description: 'The format of the generated document',
      required: true,
      defaultValue: 'pdf',
      options: {
        disabled: false,
        options: [
          { label: 'PDF', value: 'pdf' },
          { label: 'Image', value: 'image' },
        ],
      },
    }),
    outputSettings: Property.DynamicProperties({
      displayName: 'Output Settings',
      description: 'Settings for the generated document output',
      required: true,
      refreshers: ['outputType'],
      props: async ({ outputType }): Promise<InputPropertyMap> => {
        const type = outputType as unknown as string;

        if(type === 'image'){
          return {
            imageFormat: Property.StaticDropdown({
              displayName: 'Image Format',
              description: 'Enter the format of the image (e.g., png, jpg)',
              required: true,
              defaultValue: 'png',
              options: {
                disabled: false,
                options: [
                  { label: 'PNG', value: 'png' },
                  { label: 'WEBP', value: 'webp' },
                  { label: 'JPG', value: 'jpg' },
                ],
              },
            }),
            width: Property.Number({
              displayName: 'Width',
              description: 'Enter the width of the generated document in pixels',
              defaultValue: 2480,
              required: true,
            }),
            height: Property.Number({
              displayName: 'Height',
              description: 'Enter the height of the generated document in pixels',
              defaultValue: 3508,
              required: true,
            }),
          };
        }
        else { // PDF type
          return {};
        }
      },
    }),
  },
  async run({ auth, propsValue }) {
    const { templateId, fileName, outputType } = propsValue;
    const path = `/documents`;
    const body = {
      document: {
        document_template_id: templateId,
        status: 'pending',
        payload: propsValue.data,
        meta: { _filename: fileName }
      }
    };

    if(outputType === 'image'){
      const meta = body.document.meta as any;
      meta._type = propsValue.outputSettings['imageFormat'];
      meta._height = propsValue.outputSettings['height'];
      meta._width = propsValue.outputSettings['width'];
    }

    const response = await makeRequest({ auth, body, path, method: HttpMethod.POST });
    if(response.body.document?.failure_cause == null) {
      return {
        success: true,
        data: response.body.document,
      };
    }

    return {
      success: false,
      error: response.body,
    };
  },
});