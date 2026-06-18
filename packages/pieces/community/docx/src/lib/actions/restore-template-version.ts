import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { docxAuth } from '../common/auth';
import { docxRequest } from '../common/client';

export const restoreTemplateVersion = createAction({
  auth: docxAuth,
  name: 'restore_template_version',
  displayName: 'Restaurer une version de modèle',
  description:
    'Restaure une version archivée comme version active du modèle. La version courante est archivée avant écrasement.',
  props: {
    template_id: Property.ShortText({
      displayName: 'ID du modèle',
      required: true,
    }),
    version_id: Property.Number({
      displayName: 'ID de la version à restaurer',
      required: true,
    }),
  },
  async run(context) {
    const { template_id, version_id } = context.propsValue;
    return await docxRequest({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/client/templates/${template_id}/restore/${version_id}`,
    });
  },
});
