import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { signAuth } from '../common/auth';
import { signRequest } from '../common/client';

export const sendForSignature = createAction({
  auth: signAuth,
  name: 'send_for_signature',
  displayName: 'Envoyer un document à signer',
  description:
    "Envoie un PDF à signer électroniquement (eIDAS / PAdES). Crée la demande et envoie l'email d'invitation au signataire.",
  props: {
    pdf: Property.File({
      displayName: 'Fichier PDF',
      description: 'Le document PDF à faire signer.',
      required: true,
    }),
    document_name: Property.ShortText({
      displayName: 'Nom du document',
      required: true,
    }),
    signer_email: Property.ShortText({
      displayName: 'Email du signataire',
      required: true,
    }),
    signer_name: Property.ShortText({
      displayName: 'Nom du signataire',
      required: true,
    }),
    signer_role: Property.ShortText({
      displayName: 'Rôle du signataire',
      required: false,
      defaultValue: 'Client',
    }),
    signer_phone: Property.ShortText({
      displayName: 'Téléphone du signataire (format +33…)',
      description:
        'Optionnel — requis seulement si vous utilisez la vérification par SMS (OTP).',
      required: false,
    }),
    note: Property.LongText({
      displayName: "Message d'accompagnement",
      required: false,
    }),
    expiry_days: Property.Number({
      displayName: 'Expiration (jours)',
      required: false,
      defaultValue: 30,
    }),
    company_name: Property.ShortText({
      displayName: 'Nom de la société affichée',
      required: false,
    }),
  },
  async run(context) {
    const {
      pdf,
      document_name,
      signer_email,
      signer_name,
      signer_role,
      signer_phone,
      note,
      expiry_days,
      company_name,
    } = context.propsValue;

    const signer: Record<string, unknown> = {
      name: signer_name,
      email: signer_email,
      role: signer_role || 'Client',
    };
    if (signer_phone) signer['phone'] = signer_phone;

    const body: Record<string, unknown> = {
      pdf_base64: pdf.base64,
      document_name,
      signers: [signer],
    };
    if (note) body['note'] = note;
    if (expiry_days !== undefined && expiry_days !== null) {
      body['expiry_days'] = expiry_days;
    }
    if (company_name) body['company_name'] = company_name;

    return await signRequest({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/v1/documents/send',
      body,
    });
  },
});
