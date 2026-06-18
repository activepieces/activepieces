import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import FormData from 'form-data';
import { docxAuth } from '../common/auth';
import { DOCX_API_BASE, DOCX_MIME } from '../common/client';

export const uploadTemplate = createAction({
  auth: docxAuth,
  name: 'upload_template',
  displayName: 'Déposer un modèle',
  description:
    "Dépose un modèle Word (.docx) sur le compte pour pouvoir le réutiliser ensuite par son ID. Retourne l'ID du modèle et les balises détectées.",
  props: {
    template: Property.File({
      displayName: 'Fichier modèle (.docx)',
      description:
        'Le fichier Word à déposer (contient des balises {{ ... }}).',
      required: true,
    }),
  },
  async run(context) {
    const { template } = context.propsValue;
    const form = new FormData();
    form.append('template', template.data, {
      filename: template.filename || 'template.docx',
      contentType: DOCX_MIME,
    });
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${DOCX_API_BASE}/client/templates`,
      headers: {
        'X-API-Key': context.auth.secret_text,
        ...form.getHeaders(),
      },
      body: form,
    });
    return response.body;
  },
});
