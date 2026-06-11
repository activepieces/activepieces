import { HttpMethod, httpClient } from '@activepieces/pieces-common';
  import { wedofAuth } from '../../auth';
  import {
    createAction,
    Property,
  } from '@activepieces/pieces-framework';
  import { wedofCommon } from '../../common/wedof';
  
  export const getCertificationFolderSurvey = createAction({
    auth: wedofAuth,
    name: 'getCertificationFolderSurvey',
    displayName: "Récupération d'une enquête",
    description: "Permet de récupérer une enquête associée à un dossier de certification",
    audience: 'both',
    aiMetadata: {
      description:
        'Retrieves the survey associated with a single certification folder, identified by the certification folder number (externalId). Read-only and safe to repeat. Use when you know the folder; to list surveys by criteria use the list-surveys action instead.',
      idempotent: true,
    },
    props: {
      certificationFolderExternalId: Property.ShortText({
        displayName: 'N° de dossier de certification',
        description: "Sélectionner la propriété {externalId} du dossier de certification",
        required: true,
      }),
    },
  
    async run(context) {
      return (
        await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: wedofCommon.baseUrl + '/surveys/'+ context.propsValue.certificationFolderExternalId,
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': context.auth.secret_text,
          },
        })
      ).body;
    },
  });