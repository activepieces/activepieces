import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import FormData from 'form-data';
import { docxAuth } from '../common/auth';
import { DOCX_API_BASE, DOCX_MIME } from '../common/client';

export const updateTemplate = createAction({
  auth: docxAuth,
  name: 'update_template',
  displayName: 'Mettre à jour un modèle',
  description:
    "Remplace un modèle existant par une nouvelle version. L'ancienne version est automatiquement archivée (rollback possible).",
  props: {
    template_id: Property.ShortText({
      displayName: 'ID du modèle',
      required: true,
    }),
    template: Property.File({
      displayName: 'Nouveau fichier (.docx)',
      required: true,
    }),
  },
  async run(context) {
    const { template_id, template } = context.propsValue;
    const form = new FormData();
    form.append('template', template.data, {
      filename: template.filename || 'template.docx',
      contentType: DOCX_MIME,
    });
    const response = await httpClient.sendRequest({
      method: HttpMethod.PUT,
      url: `${DOCX_API_BASE}/client/templates/${template_id}`,
      headers: {
        'X-API-Key': context.auth.secret_text,
        ...form.getHeaders(),
      },
      body: form,
    });
    return response.body;
  },
});
