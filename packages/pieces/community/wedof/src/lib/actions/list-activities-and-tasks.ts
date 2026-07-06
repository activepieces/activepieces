import { wedofAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofCommon } from '../common/wedof';

export const listActivitiesAndTasks = createAction({
  auth: wedofAuth,
  name: 'listActivitiesAndTasks',
  displayName: "Liste de toutes les activités et tâches d'un dossier",
  description: "Liste de toutes les activités et tâches d'un dossier (Dossier de formation / Dossier de certification)",
  audience: 'both',
  aiMetadata: {
    description:
      'Lists all activities and tasks recorded on a single folder, which can be either a training (registration) folder or a certification folder selected via the folder-type input. Read-only and safe to repeat. Use to inspect the activity/task history of one specific folder by its number.',
    idempotent: true,
  },
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
  },
  async run(context) {
    return (
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url:
          wedofCommon.baseUrl +
          '/activities/' +context.propsValue.entityClass+'/'+
          context.propsValue.externalId,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth.secret_text,
        },
      })
    ).body;
  },
});
