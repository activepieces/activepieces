import { wedofAuth } from '../../../index';
import { createAction, DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofCommon } from '../../common/wedof';

export const createCertificationPartnerAudit = createAction({
  auth: wedofAuth,
  name: 'createCertificationPartnerAudit',
  displayName: "Créer un audit sur un partenariat de certification",
  description: "Permet de créer un audit sur un partenariat de certification",
  props: {
    certifInfo: Property.ShortText({
      displayName: 'N° certifInfo',
      description: "Permet de n'obtenir que les modèles liés à la certification considérée",
      required: true,
    }),
    siret: Property.ShortText({
      displayName: 'N° de siret',
      description:
        'Sélectionner le SIRET du partenaire',
      required: true,
    }),
    templateId: Property.DynamicProperties({
      displayName: "Type du modèle d'audit",
      refreshers: ['certifInfo'],
      required: true,
      props: async ({ auth, certifInfo }) => {
        if (!certifInfo) {
          console.error('certifInfo is undefined');
          return {};
        }
        try {
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${wedofCommon.baseUrl}/certificationPartnerAuditTemplates`,
            queryParams: { certifInfo: certifInfo as unknown as string },
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': auth as unknown as string,
            },
          });
    
          const options = response.body.map((template: { id: string; name: string }) => ({
            label: template.name,
            value: template.id,
          }));
    
          return {
            templateId: Property.StaticDropdown({
              displayName: "Modèle d'audit",
              required: true,
              options: {
                options: options,
              },
            }),
          } as DynamicPropsValue;
    
        } catch (error) {
          console.error('Error fetching templates:', error);
          return {};
        }
      },
    }),
  },
  async run(context) {
     const message = {
      templateId: context.propsValue.templateId['templateId'] ?? null,
      };
      return (
        await httpClient.sendRequest({
          method: HttpMethod.POST,
          url:
            wedofCommon.baseUrl +
            '/certifications/' +
            context.propsValue.certifInfo +
            '/partners/'+ context.propsValue.siret + '/audits',
          body: message,
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': context.auth as string,
          },
        })
      ).body;
  },
});