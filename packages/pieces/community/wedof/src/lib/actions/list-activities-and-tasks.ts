import { wedofAuth } from '../../index';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofCommon } from '../common/wedof';

export const listActivitiesAndTasks = createAction({
  auth: wedofAuth,
  name: 'listActivitiesAndTasks',
  displayName: "Liste de toutes les activités et tâches d'un dossier",
  description: "Liste de toutes les activités et tâches d'un dossier (Dossier de formation / Dossier de certification)",
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
  },
  async run(context) {
    return (
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url:
          wedofCommon.baseUrl +
          '/activities/' +context.propsValue.entityClass+'/'+
          context.propsValue.Id,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
      })
    ).body;
  },
});
