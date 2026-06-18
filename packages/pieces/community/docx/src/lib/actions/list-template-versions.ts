import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { docxAuth } from '../common/auth';
import { docxRequest } from '../common/client';

interface DocxVersion {
  version_id: number;
  version_number: number;
  content_hash?: string;
  original_name?: string;
  size_bytes?: number;
  archived_at?: string;
}

export const listTemplateVersions = createAction({
  auth: docxAuth,
  name: 'list_template_versions',
  displayName: "Lister les versions d'un modèle",
  description: "Liste l'historique des versions archivées d'un modèle.",
  props: {
    template_id: Property.ShortText({
      displayName: 'ID du modèle',
      required: true,
    }),
  },
  async run(context) {
    const { template_id } = context.propsValue;
    const data = await docxRequest<{ versions?: DocxVersion[] }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/client/templates/${template_id}/versions`,
    });
    return (data.versions || []).map((v) => ({
      id: v.version_id,
      version_number: v.version_number,
      content_hash: v.content_hash,
      original_name: v.original_name,
      size_bytes: v.size_bytes,
      archived_at: v.archived_at,
    }));
  },
});
