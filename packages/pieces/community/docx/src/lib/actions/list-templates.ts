import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { docxAuth } from '../common/auth';
import { docxRequest } from '../common/client';

interface DocxTemplate {
  id: string;
  name?: string;
  size?: number;
  client_name?: string;
}

export const listTemplates = createAction({
  auth: docxAuth,
  name: 'list_templates',
  displayName: 'Trouver un modèle',
  description:
    'Liste les modèles déposés pour la clé API, avec un filtre optionnel par nom.',
  props: {
    name: Property.ShortText({
      displayName: 'Filtrer par nom (optionnel)',
      description:
        'Laissez vide pour lister tous les modèles, ou saisissez un texte contenu dans le nom du modèle.',
      required: false,
    }),
  },
  async run(context) {
    const { name } = context.propsValue;
    const data = await docxRequest<{ templates?: DocxTemplate[] }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/client/templates',
    });
    const filter = (name || '').toLowerCase();
    return (data.templates || [])
      .filter((t) => !filter || (t.name || '').toLowerCase().includes(filter))
      .map((t) => ({
        id: t.id,
        name: t.name,
        size: t.size,
        client_name: t.client_name,
      }));
  },
});
