import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofAuth } from '../../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const abortCertificationFolder = createAction({
  auth: wedofAuth,
  name: 'abortCertificationFolder',
  displayName: 'Passer un dossier de certification à l’état : Abandonné',
  description: "Change l'état d'un dossier de certification vers : Abandonné",
  audience: 'both',
  aiMetadata: {
    description:
      "Transition a Wedof certification folder into the 'aborted' (abandoned) state, optionally with a comment. Pick this when the candidate withdraws or the certification process is given up; distinct from 'refuse', which rejects an enrollment request. Follows the certification-folder state machine and is not idempotent. Requires the folder's externalId.",
    idempotent: false,
  },
  props: {
    externalId: Property.ShortText({
      displayName: 'N° du dossier de certification',
      description:
        'Sélectionner la propriété {externalId} du dossier de certification',
      required: true,
    }),
    comment: Property.LongText({
      displayName: 'Commentaire',
      required: false,
    }),
  },
  async run(context) {
    const message = {
      comment: context.propsValue.comment,
    };
    return (
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url:
          wedofCommon.baseUrl +
          '/certificationFolders/' +
          context.propsValue.externalId +
          '/abort',
        body: message,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth.secret_text,
        },
      })
    ).body;
  },
});
