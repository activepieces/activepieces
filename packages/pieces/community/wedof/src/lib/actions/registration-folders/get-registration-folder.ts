import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofAuth } from '../../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const getRegistrationFolder = createAction({
  auth: wedofAuth,
  name: 'getRegistrationFolder',
  displayName: 'Récupérer un dossier de formation',
  description:
    'Récupérer un dossier de formation à partir de son n° de dossier',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves a single training registration folder by its folder number (externalId). Read-only and safe to repeat. Use when you already know the folder number; to find folders by criteria use the search-folders action instead.',
    idempotent: true,
  },
  props: {
    externalId: Property.ShortText({
      displayName: 'N° du dossier de formation',
      description:
        'Sélectionner la propriété {externalId} du dossier de formation',
      required: true,
    }),
  },

  async run(context) {
    return (
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url:
          wedofCommon.baseUrl +
          '/registrationFolders/' +
          context.propsValue.externalId,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth.secret_text,
        },
      })
    ).body;
  },
});
