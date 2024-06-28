import { wedofAuth } from '../../index';
import { createAction, DynamicPropsValue, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofCommon } from '../common/wedof';

export const sendFile = createAction({
  auth: wedofAuth,
  name: 'sendFile',
  displayName: "Envoyer un fichier",
  description: "Permet d'envoyer un fichier pour un dossier (Dossier de formation / Dossier de certification)",
  props: {
    entityClass: Property.StaticDropdown({
      displayName: "Choisir le type de dossier",
      description: "Permet de n'obtenir que les dossiers dans le type considéré - par défaut tous les types sont retournés",
      required: true,
      options: {
        options: [
          {
            value: "certificationFolders",
            label: 'Dossier de certification',
          },
          {
            value: "registrationFolders",
            label: 'Dossier de formation',
          },
        ],
        disabled: false,
      },
    }),
    Id: Property.ShortText({
      displayName: 'N° du dossier',
      description:
        'Sélectionner la propriété {Id} du dossier',
      required: true,
    }),
    title: Property.ShortText({
        displayName: 'Titre du fichier',
        required: false,
    }),
    typeId: Property.DynamicProperties({
      displayName: 'Merge Fields',
      refreshers: ['entityClass', 'Id'],
      required: true,
      props: async ({ auth, entityClass, Id }) => {
        const fields: DynamicPropsValue = {};
        if (!entityClass) {
          console.error('entityClass is undefined');
          return {};
        }
        if (!Id) {
          console.error('Id is undefined');
          return {};
        }
        try {
          const res = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${wedofCommon.baseUrl}/${entityClass}/${Id}/files`,
            headers: {
              'Content-Type': 'application/json',
              'X-Api-Key': auth as unknown as string,
            },
          });
          const data = res.body;
          if (Array.isArray(data)) {
            data.forEach((field: { id: string | number; name: string; }) => {
              fields[field.id] = Property.StaticDropdown({
                displayName: field.name,
                options: {
                  options: data.map((option: { typeId: string; name: string; }) => ({
                    value: option.typeId,
                    label: option.name,
                  })),
                  disabled: false,
                },
                required: false,
              });
            });
          }
        } catch (error) {
          console.error('Error fetching data:', error);
        }
        return fields;
      },
    }),
    
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
