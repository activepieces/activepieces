import { slidespeakAuth } from '../auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { BASE_URL } from '../common/constants';
import FormData from 'form-data';

export const editPresentationAction = createAction({
  auth: slidespeakAuth,
  name: 'edit-presentation',
  displayName: 'Edit Presentation',
  description: 'Edits an existing presentation.',
  audience: 'both',
  aiMetadata: { description: 'Modifies an existing PowerPoint (.pptx) by applying a config of shape replacements (each targeting a named shape and supplying new content). Use to programmatically swap text/placeholder values in a deck you already have. Requires the .pptx file and a replacements config; each call submits a new edit job, so it is not idempotent.', idempotent: false },
  props: {
    pptx_file: Property.File({
      displayName: 'Powepoint File (.pptx)',
      required: true,
    }),
    config: Property.Json({
      displayName: 'Config',
      required: true,
      defaultValue: {
        replacements: [
          {
            shape_name: 'TARGET_TITLE',
            content: 'Your new title',
          },
        ],
      },
    }),
  },
  async run(context) {
    const { pptx_file, config } = context.propsValue;
    const apiKey = context.auth;

    const formData = new FormData();
    const fileBuffer = Buffer.from(pptx_file.base64, 'base64');
    formData.append('pptx_file', fileBuffer, pptx_file.filename);
    formData.append('config', JSON.stringify(config));

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: BASE_URL + '/presentation/edit',
      headers: {
        'X-API-key': apiKey.secret_text,
        ...formData.getHeaders()
      },
      body: formData,
    });

    return response.body;
  },
});
