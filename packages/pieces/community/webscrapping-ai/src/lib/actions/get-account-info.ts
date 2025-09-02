import { Action, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wsaiPaths, wsaiRequest, WebScrapingAiAuth } from '../common/client';

export const getAccountInformation: Action = createAction({
    name: 'get_account_information',
    displayName: 'Get Account Information',
    description: 'Returns information about your account: remaining API credits, next billing cycle start time, and remaining concurrent requests.',
    props: {},
    async run(context) {
        const auth: WebScrapingAiAuth = { apiKey: (context.auth as any).apiKey as string }
        const result = await wsaiRequest<{
            email?: string
            remaining_api_calls: number
            resets_at: number
            remaining_concurrency: number
        }>({
            method: HttpMethod.GET,
            path: wsaiPaths.account,
            auth,
        })
        return result
    },
})


