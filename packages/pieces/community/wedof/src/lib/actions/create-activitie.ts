import { wedofAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofCommon } from '../common/wedof';
import dayjs from 'dayjs';

export const createActivitie = createAction({
  auth: wedofAuth,
  name: 'createActivitie',
  displayName: "Créer une activité",
  description: "Permet de créer une activité d'un dossier (Dossier de formation / Dossier de certification)",
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
        displayName: "Titre de l'activité",
        required: true,
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
    eventTime: Property.DateTime({
      displayName: "Date de début",
      description: 'Date au format YYYY-MM-DD.',
      required: true,
    }),
    eventEndTime: Property.DateTime({
     displayName: "Date d'échéance",
     description: 'Date au format YYYY-MM-DD.',
     required: false,
    }),
    link: Property.ShortText({
        displayName: "Lien (url) vers la tâche",
        required: false,
    }),

  },
  async run(context) {
    const message = {
        title: context.propsValue.title ?? null,
        eventEndTime: context.propsValue.eventEndTime
        ? dayjs(context.propsValue.eventEndTime).format('YYYY-MM-DD')
        : null,
        type: context.propsValue.type,
        qualiopiIndicators: context.propsValue.qualiopiIndicators,
        description: context.propsValue.description ?? null,
        userEmail: context.propsValue.userEmail ?? null,
        link: context.propsValue.link ?? null,
        eventTime: context.propsValue.eventTime
        ? dayjs(context.propsValue.eventTime).format('YYYY-MM-DD')
        : null,
        origin: "manual",
      };
      return (
        await httpClient.sendRequest({
          method: HttpMethod.POST,
          url:
            wedofCommon.baseUrl +
            '/activities/' +
            context.propsValue.entityClass +
            '/'+ context.propsValue.Id,
          body: message,
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': context.auth as string,
          },
        })
      ).body;
  },
});
