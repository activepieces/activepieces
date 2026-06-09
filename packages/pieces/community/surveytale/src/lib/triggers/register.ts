import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework'
import { httpClient, HttpRequest, HttpMethod } from '@activepieces/pieces-common'
import { SURVEYTALE_BASE_URL, surveyTaleAuth } from '../auth'
import { isNil } from '@activepieces/shared'
import { surveyIdProp } from '../common/props'

export const surveyTaleRegisterTrigger = ({
    name,
    displayName,
    eventType,
    description,
    sampleData,
}: {
    name: string
    displayName: string
    eventType: string
    description: string
    sampleData: unknown
}) =>
    createTrigger({
        auth: surveyTaleAuth,
        name: `surveytale_trigger_${name}`,
        displayName,
        description,
        props: {
            surveyIds: surveyIdProp,
        },
        sampleData,
        type: TriggerStrategy.WEBHOOK,
        async onEnable(context) {
            const apiKey = context.auth.secret_text as string
            const response = await httpClient.sendRequest<WebhookInformation>({
                method: HttpMethod.POST,
                url: `${SURVEYTALE_BASE_URL}/api/v1/webhooks`,
                body: {
                    url: context.webhookUrl,
                    triggers: [eventType],
                    surveyIds: context.propsValue.surveyIds ?? [],
                },
                headers: {
                    'x-api-key': apiKey,
                },
            })
            await context.store.put<string>(`surveytale_${name}_trigger`, response.body.data.id)
        },
        async onDisable(context) {
            const apiKey = context.auth.secret_text as string
            const webhook = await context.store.get<string>(`surveytale_${name}_trigger`)
            if (!isNil(webhook)) {
                const request: HttpRequest = {
                    method: HttpMethod.DELETE,
                    url: `${SURVEYTALE_BASE_URL}/api/v1/webhooks/${webhook}`,
                    headers: {
                        'x-api-key': apiKey,
                    },
                }
                await httpClient.sendRequest(request)
            }
        },
        async run(context) {
            return [context.payload.body]
        },
    })

interface WebhookInformation {
    data: {
        id: string
        name: string
        createdAt: string
        updatedAt: string
        url: string
        source: string
        environmentId: string
        triggers: Array<string>
        surveyIds: Array<string>
    }
}
