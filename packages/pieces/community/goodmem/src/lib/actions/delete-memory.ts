import { HttpMethod, httpClient } from '@activepieces/pieces-common'
import { createAction, Property } from '@activepieces/pieces-framework'
import { goodmemAuth } from '../../index'
import { extractAuthFromContext, getBaseUrl, getCommonHeaders } from '../common'

export const deleteMemory = createAction({
    auth: goodmemAuth,
    name: 'delete_memory',
    displayName: 'Delete Memory',
    description: 'Permanently delete a memory and its associated chunks and vector embeddings.',
    props: {
        memoryId: Property.ShortText({
            displayName: 'Memory ID',
            description: 'The UUID of the memory to delete (returned by Create Memory)',
            required: true,
        }),
    },
    async run(context) {
        const { memoryId } = context.propsValue
        const { baseUrl: rawBaseUrl, apiKey } = extractAuthFromContext(context.auth)
        const baseUrl = getBaseUrl(rawBaseUrl)

        try {
            await httpClient.sendRequest({
                method: HttpMethod.DELETE,
                url: `${baseUrl}/v1/memories/${memoryId}`,
                headers: getCommonHeaders(apiKey),
            })

            return {
                success: true,
                memoryId,
                message: 'Memory deleted successfully',
            }
        } catch (error: any) {
            return {
                success: false,
                error: error.message || 'Failed to delete memory',
                details: error.response?.body || error,
            }
        }
    },
})
