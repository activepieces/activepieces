import { createAction, Property } from '@activepieces/pieces-framework';
import { docxAuth } from '../common/auth';
import { docxRenderToBuffer } from '../common/client';

export const renderFacturx = createAction({
  auth: docxAuth,
  name: 'render_facturx',
  displayName: 'Générer une facture Factur-X',
  description:
    "Génère une facture électronique conforme à la réforme 2026 (Factur-X / PDF-A3) à partir d'un modèle déposé et de données JSON.",
  props: {
    template_id: Property.ShortText({
      displayName: 'ID du modèle',
      description:
        "Identifiant d'un modèle déjà déposé via l'action « Déposer un modèle ».",
      required: true,
    }),
    json_data: Property.LongText({
      displayName: 'Données (JSON)',
      description:
        'Données de la facture au format JSON, ex : {"Npiece":"F2026-001","client":"ACME","total":1200}.',
      required: true,
    }),
    output_filename: Property.ShortText({
      displayName: 'Nom du fichier',
      required: false,
      defaultValue: 'facture.pdf',
    }),
  },
  async run(context) {
    const { template_id, json_data, output_filename } = context.propsValue;
    const filename = output_filename || 'facture.pdf';
    const buffer = await docxRenderToBuffer({
      apiKey: context.auth.secret_text,
      path: '/render-facturx',
      formBody: {
        template_id,
        json_data,
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
