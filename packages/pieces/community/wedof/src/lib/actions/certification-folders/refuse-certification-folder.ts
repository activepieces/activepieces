import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { wedofAuth } from '../../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { wedofCommon } from '../../common/wedof';

export const refuseCertificationFolder = createAction({
  auth: wedofAuth,
  name: 'refuseCertificationFolder',
  displayName: 'Passer un dossier de certification à l’état : Refuser',
  description: "Change l'état d'un dossier de certification vers : Refuser",
  audience: 'both',
  aiMetadata: {
    description:
      "Transition a Wedof certification folder into the 'refused' state, optionally with a comment. Pick this to reject a certification enrollment request; distinct from 'abort', which marks an already-accepted folder as abandoned. Follows the certification-folder state machine and is not idempotent. Requires the folder's externalId.",
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
          '/refuse',
        body: message,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth.secret_text,
        },
      })
    ).body;
  },
});
