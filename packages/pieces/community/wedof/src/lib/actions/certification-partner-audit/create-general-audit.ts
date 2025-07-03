import { wedofAuth } from '../../../index';
import { createAction, DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofCommon } from '../../common/wedof';

export const createGeneralAudit = createAction({
  auth: wedofAuth,
  name: 'createGeneralAudit',
  displayName: "Générer un audit général sur les partenaires d'une certification",
  description: "Permet de générer et clôturer un audit pour chacun des partenariats (actifs) de certification",
  props: {
    certifInfo: Property.ShortText({
      displayName: 'N° certifInfo',
      description: "Permet de n'obtenir que les partenariats liés à la certification considérée",
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
    complete: Property.StaticDropdown({
        displayName: "Clôturer les audits automatiquement",
        description: "Indique si l'audit doit être clôturer",
        required: false,
        defaultValue : true,
        options: {
            disabled: false,
            options: [
              {
                label: "Non",
                value: false,
              },
              {
                label: 'Oui',
                value: true,
              },
            ],
          },
    }),
    updateCompliance: Property.StaticDropdown({
        displayName: "Mettre à jour la conformité du partenariat",
        description: "Indique si il faut mettre à jour la conformité du partenariat",
        required: false,
        defaultValue : true,
        options: {
            disabled: false,
            options: [
              {
                label: "Non",
                value: false,
              },
              {
                label: 'Oui',
                value: true,
              },
            ],
          },
    }),
    suspend: Property.StaticDropdown({
        displayName: "Suspendre automatiquement le partenariat en cas de non-conformité",
        description: "Indique si le partenariat doit être suspendu en cas de non-conformité (ne s'applique que pour les certifications actives)",
        required: false,
        defaultValue : true,
        options: {
            disabled: false,
            options: [
              {
                label: "Non",
                value: false,
              },
              {
                label: 'Oui',
                value: true,
              },
            ],
          },
    }),

  },
  async run(context) {
     const message = {
      templateId: context.propsValue.templateId['templateId'] ?? null,
      complete: context.propsValue.complete,
      updateCompliance: context.propsValue.updateCompliance,
      suspend: context.propsValue.suspend,
      };
      return (
        await httpClient.sendRequest({
          method: HttpMethod.POST,
          url:
            wedofCommon.baseUrl +
            '/certifications/' +
            context.propsValue.certifInfo + '/partners/audits',
          body: message,
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': context.auth as string,
          },
        })
      ).body;
  },
});