import { createAction, Property } from '@activepieces/pieces-framework';
import { docxAuth } from '../common/auth';
import { docxDownloadToBuffer } from '../common/client';

export const downloadTemplateVersion = createAction({
  auth: docxAuth,
  name: 'download_template_version',
  displayName: 'Télécharger une version de modèle',
  description:
    "Télécharge le fichier .docx d'une version archivée d'un modèle.",
  props: {
    template_id: Property.ShortText({
      displayName: 'ID du modèle',
      required: true,
    }),
    version_id: Property.Number({
      displayName: 'ID de la version',
      required: true,
    }),
  },
  async run(context) {
    const { template_id, version_id } = context.propsValue;
    const buffer = await docxDownloadToBuffer({
      apiKey: context.auth.secret_text,
      path: `/client/templates/${template_id}/versions/${version_id}`,
    });
    const filename = `${template_id}-v${version_id}.docx`;
    const file = await context.files.write({
      fileName: filename,
      data: buffer,
    });
    return { filename, file };
  },
});
