import { HttpMethod, httpClient } from '@activepieces/pieces-common'
import { Property, createAction } from '@activepieces/pieces-framework'
import { wedofAuth } from '../../..'
import { wedofCommon } from '../../common/wedof'

export const refuseCertificationFolder = createAction({
  auth: wedofAuth,
  name: 'refuseCertificationFolder',
  displayName: 'Passer un dossier de certification à l’état : Refuser',
  description: "Change l'état d'un dossier de certification vers : Refuser",
  props: {
    externalId: Property.ShortText({
      displayName: 'N° du dossier de certification',
      description: 'Sélectionner la propriété {externalId} du dossier de certification',
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
    }
    return (
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: wedofCommon.baseUrl + '/certificationFolders/' + context.propsValue.externalId + '/refuse',
        body: message,
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': context.auth as string,
        },
      })
    ).body
  },
})
