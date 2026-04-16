import { createAction, Property } from '@activepieces/pieces-framework'
import { EnvelopesApi } from 'docusign-esign'
import { DocusignAuthType } from '../../'
import { docusignAuth } from '../auth'
import { createApiClient } from '../common'

export const getEnvelope = createAction({
    name: 'getEnvelope',
    displayName: 'Get envelope',
    description: 'Get Docusign envelope',
    auth: docusignAuth,
    props: {
        accountId: Property.ShortText({
            displayName: 'Account ID',
            required: true,
        }),
        envelopeId: Property.ShortText({
            displayName: 'Envelope ID',
            required: true,
        }),
    },
    async run({ auth, propsValue }) {
        const apiClient = await createApiClient(auth)
        const envelopeApiClient = new EnvelopesApi(apiClient)
        return await envelopeApiClient.getEnvelope(propsValue.accountId, propsValue.envelopeId)
    },
})
