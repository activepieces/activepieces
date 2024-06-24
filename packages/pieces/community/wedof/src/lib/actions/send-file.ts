import { wedofAuth } from '../../index';
import { createAction, DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';
import { wedofCommon } from '../common/wedof';

export const sendFile = createAction({
  auth: wedofAuth,
  name: 'sendFile',
  displayName: "Envoyer un fichier",
  description: "Permet d'envoyer un fichier pour un dossier (Dossier de formation / Dossier de certification)",
  props: {
    Id: Property.ShortText({
      displayName: 'N° du dossier',
      description:
        'Sélectionner la propriété {Id} du dossier',
      required: true,
    }),
    entityClass: Property.StaticDropdown({
      displayName: "Choisir le type de dossier",
      description: "Permet de n'obtenir que les dossiers dans le type considéré - par défaut tous les types sont retournés",
      required: true,
      options: {
        options: [
          {
            value: "CertificationFolder",
            label: 'Dossier de certification',
          },
          {
            value: "RegistrationFolder",
            label: 'Dossier de formation',
          },
        ],
        disabled: false,
      },
    }),
    title: Property.ShortText({
        displayName: 'Titre du fichier',
        required: false,
    }),
    typeId: Property.DynamicProperties({
      displayName: 'Merge Fields',
      refreshers: ['entityClass', 'Id'],
      required: true,
      props: async ({ context }) => {
        if (!context) return {};
        if (!context['propsValue'].entityClass || !context['propsValue'].Id) return {};
    
        const fields: DynamicPropsValue = {};
    
        try {
          const res = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${wedofCommon.baseUrl}/${context['propsValue'].entityClass}/${context['propsValue'].Id}/files`,
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': context['auth'] as string,
            },
          });
    
          const data = res.body;
          data.forEach((field: { key: string | number; label: any; options: any; }) => {
            fields[field.key] = Property.StaticDropdown({
              displayName: field.label,
              options: field.options.map((option: { value: any; label: any; }) => ({
                value: option.value,
                label: option.label,
              })),
              required: false,
            });
          });
        } catch (error) {
          console.error('Error fetching data:', error);
        }
    
        return fields;
      },
    }),
 /*   typeId: Property.Number({
      displayName: "Type de fichier",
      required: true,
  }),*/
    file: Property.File({
        displayName: "Fichier a envoyer",
        required: true,
    }),

  },
  async run(context) {
    const message = {
        title: context.propsValue.title ?? null,
        typeId: context.propsValue.typeId,
        file: context.propsValue.file,
      };
      return (
        await httpClient.sendRequest({
          method: HttpMethod.POST,
          url:
            wedofCommon.baseUrl +
            '/' +
            context.propsValue.entityClass +
            '/'+ context.propsValue.Id + '/files',
          body: message,
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': context.auth as string,
          },
        })
      ).body;
  },
});
