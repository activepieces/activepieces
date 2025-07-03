import { HttpMethod, httpClient } from '@activepieces/pieces-common';
  import { wedofAuth } from '../../..';
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
            'X-Api-Key': context.auth as string,
          },
        })
      ).body;
    },
  });