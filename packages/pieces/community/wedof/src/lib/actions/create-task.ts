import { wedofAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofCommon } from '../common/wedof';
import dayjs from 'dayjs';

export const createTask = createAction({
  auth: wedofAuth,
  name: 'createTask',
  displayName: "Créer une tâche",
  description: "Permet de créer une tâche d'un dossier (Dossier de formation / Dossier de certification)",
  props: {
    entityClass: Property.StaticDropdown({
      displayName: "Choisir le type de dossier",
      description: "Permet de n'obtenir que les dossiers dans le type considéré - par défaut tous les types sont retournés",
      required: true,
      options: {
        options: [
          {label: "Dossier de certification", value: "CertificationFolder"},
          {label: "Dossier de formation", value: "RegistrationFolder"},
          {label: "Proposition commerciale", value: "Proposal"}
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
        displayName: 'Titre de la tâche',
        required: true,
    }),
    dueDate: Property.DateTime({
        displayName: "Date d'échéance",
        description: 'Date au format YYYY-MM-DDTHH:mm:ssZ.',
        required: false,
    }),
    type:wedofCommon.tasks,
    qualiopiIndicators:wedofCommon.qualiopiIndicators,
    description: Property.ShortText({
        displayName: 'Description',
        required: false,
    }),
    userEmail: Property.ShortText({
        displayName: "Responsable (email de l'utilisateur)",
        required: true,
    }),
    link: Property.ShortText({
        displayName: "Lien (url) vers la tâche",
        required: false,
    }),

  },
  async run(context) {
    const message = {
        title: context.propsValue.title ?? null,
        dueDate: context.propsValue.dueDate ? dayjs(context.propsValue.dueDate) : null,
        eventEndTime: null,
        type: context.propsValue.type,
        qualiopiIndicators: context.propsValue.qualiopiIndicators,
        description: context.propsValue.description ?? null,
        userEmail: context.propsValue.userEmail ?? null,
        link: context.propsValue.link ?? null,
        eventTime: null,
        origin: "manual",
      };
      return (
        await httpClient.sendRequest({
          method: HttpMethod.POST,
          url:
            wedofCommon.baseUrl +
            '/activities/' +
            context.propsValue.entityClass +
            '/'+ context.propsValue.externalId,
          body: message,
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': context.auth as string,
          },
        })
      ).body;
  },
});
