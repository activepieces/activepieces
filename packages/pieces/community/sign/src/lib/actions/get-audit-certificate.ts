import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { signAuth } from '../common/auth';
import { signRequest } from '../common/client';

export const getAuditCertificate = createAction({
  auth: signAuth,
  name: 'get_audit_certificate',
  displayName: 'Récupérer le certificat de preuve',
  description:
    'Récupère le certificat de preuve juridique complet : qui a signé, depuis quelle IP, à quelle heure, avec la chaîne de hachage cryptographique.',
  props: {
    document_id: Property.ShortText({
      displayName: 'ID du document',
      required: true,
    }),
  },
  async run(context) {
    const { document_id } = context.propsValue;
    const data = await signRequest<{ certificate?: Record<string, unknown> }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/v1/documents/${document_id}/audit`,
    });
    const cert = data.certificate || {};
    return { id: document_id, ...cert };
  },
});
