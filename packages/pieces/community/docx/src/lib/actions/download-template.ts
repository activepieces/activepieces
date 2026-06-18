import { createAction, Property } from '@activepieces/pieces-framework';
import { docxAuth } from '../common/auth';
import { docxDownloadToBuffer } from '../common/client';

export const downloadTemplate = createAction({
  auth: docxAuth,
  name: 'download_template',
  displayName: 'Télécharger un modèle',
  description: "Télécharge le fichier .docx d'un modèle déposé.",
  props: {
    template_id: Property.ShortText({
      displayName: 'ID du modèle',
      required: true,
    }),
  },
  async run(context) {
    const { template_id } = context.propsValue;
    const buffer = await docxDownloadToBuffer({
      apiKey: context.auth.secret_text,
      path: `/client/templates/${template_id}`,
    });
    const filename = `${template_id}.docx`;
    const file = await context.files.write({
      fileName: filename,
      data: buffer,
    });
    return { template_id, filename, file };
  },
});
