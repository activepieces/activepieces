import { createAction, Property } from '@activepieces/pieces-framework';
import { docxAuth } from '../common/auth';
import { docxRenderToBuffer } from '../common/client';

export const renderDocument = createAction({
  auth: docxAuth,
  name: 'render_document',
  displayName: 'Générer un document',
  description:
    "Génère un document (PDF ou DOCX) — devis, contrat, attestation — à partir d'un modèle déposé et de données JSON.",
  props: {
    template_id: Property.ShortText({
      displayName: 'ID du modèle',
      required: true,
    }),
    json_data: Property.LongText({
      displayName: 'Données (JSON)',
      required: true,
    }),
    output_format: Property.StaticDropdown({
      displayName: 'Format',
      required: false,
      defaultValue: 'pdf',
      options: {
        options: [
          { label: 'PDF', value: 'pdf' },
          { label: 'DOCX', value: 'docx' },
        ],
      },
    }),
    output_filename: Property.ShortText({
      displayName: 'Nom du fichier',
      required: false,
      defaultValue: 'document.pdf',
    }),
  },
  async run(context) {
    const { template_id, json_data, output_format, output_filename } =
      context.propsValue;
    const filename = output_filename || 'document.pdf';
    const buffer = await docxRenderToBuffer({
      apiKey: context.auth.secret_text,
      path: '/render-document',
      formBody: {
        template_id,
        json_data,
        output_format: output_format || 'pdf',
        output_filename: filename,
      },
    });
    const file = await context.files.write({
      fileName: filename,
      data: buffer,
    });
    return { filename, file };
  },
});
