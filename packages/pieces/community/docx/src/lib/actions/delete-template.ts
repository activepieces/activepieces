import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { docxAuth } from '../common/auth';
import { docxRequest } from '../common/client';

export const deleteTemplate = createAction({
  auth: docxAuth,
  name: 'delete_template',
  displayName: 'Supprimer un modèle',
  description:
    'Supprime définitivement un modèle et tout son historique de versions.',
  props: {
    template_id: Property.ShortText({
      displayName: 'ID du modèle',
      required: true,
    }),
  },
  async run(context) {
    const { template_id } = context.propsValue;
    return await docxRequest({
      apiKey: context.auth.secret_text,
      method: HttpMethod.DELETE,
      path: `/client/templates/${template_id}`,
    });
  },
});
