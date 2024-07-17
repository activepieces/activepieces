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
    externalId: Property.ShortText({
      displayName: 'N° du dossier',
      description:
        'Sélectionner la propriété {externalId} du dossier',
      required: true,
    }),
    title: Property.ShortText({
        displayName: 'Titre du fichier',
        required: false,
    }),
    typeId: Property.DynamicProperties({
      displayName: 'Type du fichier',
      refreshers: ['entityClass', 'externalId'],
      required: true,
      props: async ({ auth, entityClass, externalId }) => {
        const fields: DynamicPropsValue = {};
        if (!entityClass) {
          console.error('entityClass is undefined');
          return {};
        }
       if (!externalId) {
          console.error('externalId is undefined');
          return {};
        }
        try {
          const res = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: `${wedofCommon.baseUrl}/${entityClass}/${externalId}/files`,
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
    typeFile: Property.StaticDropdown({
      displayName: "Choisir le type de dossier",
      description: "Permet de n'obtenir que les dossiers dans le type considéré - par défaut tous les types sont retournés",
      required: true,
      options: {
        options: [
          {
            value: "1",
            label: 'Attacher un document',
          },
          {
            value: "2",
            label: "Ajouter à partir d'un lien",
          },
        ],
        disabled: false,
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
            '/'+ context.propsValue.externalId + '/files',
          body: message,
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': context.auth as string,
          },
        })
      ).body;
  },
});
