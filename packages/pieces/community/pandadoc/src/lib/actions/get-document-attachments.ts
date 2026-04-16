import { HttpMethod } from '@activepieces/pieces-common'
import { createAction, Property } from '@activepieces/pieces-framework'
import { pandadocAuth, pandadocClient } from '../common'
import { documentAttachmentDropdown, documentDropdown } from '../common/dynamic-dropdowns'

export const getDocumentAttachments = createAction({
    name: 'getDocumentAttachments',
    displayName: 'Get Document Attachment',
    description: 'Retrieves details of a specific attachment from a document.',
    auth: pandadocAuth,
    props: {
        document_id: documentDropdown,
        attachment_id: documentAttachmentDropdown,
    },
    async run({ auth, propsValue }) {
        return await pandadocClient.makeRequest(
            auth.secret_text,
            HttpMethod.GET,
            `/documents/${propsValue.document_id}/attachments/${propsValue.attachment_id}`,
        )
    },
})
