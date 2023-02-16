import { httpClient } from "../../../common/http/core/http-client"
import { HttpRequest } from "../../../common/http/core/http-request"
import { HttpMethod } from "../../../common/http/core/http-method"
import { Property } from "../../../framework/property"
import { createTrigger, Trigger, TriggerStrategy } from "../../../framework/trigger/trigger"

import { WebhookTrigger } from "@activepieces/shared"

export const registerWebhooks = ({
  name,
  description,
  displayName
}: {
  name: string,
  description: string,
  displayName: string
}) : Trigger => 
  createTrigger({
    name,
    description,
    displayName,
    
    props: {
      api_key: Property.ShortText({
        displayName: 'API Key',
        description: 'API Key provided by cal.com',
        required: true
      })
    },

    sampleData: {
      "webhook": {
        "id": '33e36d1d-e537-4200-9d63-3ee2f990e807',
        "userId": 63926,
        "eventTypeId": null,
        "payloadTemplate": null,
        "eventTriggers": [ 'BOOKING_CANCELLED' ],
        "appId": null,
        "subscriberUrl": 'http://localhost:3000/v1/webhooks?flowId=3fazyQLtpJ4mhg5l8Nsux'
      },
      "message": "webhook created successfully"
    },

    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
      const request: HttpRequest = {
        method: HttpMethod.POST,
        url: `https://api.cal.com/v1/hooks`,
        body: {
          eventTriggers: [name],
          subscriberUrl: context.webhookUrl,
          active: true
        },
        queryParams: {
          apiKey: context.propsValue.api_key!
        }
      }

      const response = await httpClient.sendRequest<WebhookResponseBody>(request)

      if (response.status === 200) {
        console.debug("trigger.onEnable", response.body.webhook, context)
        await context.store?.put(`cal_com_trigger_${name}`, response.body.webhook)
      }
    },
    async onDisable(context) {
      const data = await context.store?.get<WebhookInformation>(`cal_com_trigger_${name}`)
      if (data != null) {
        const request: HttpRequest = {
          method: HttpMethod.DELETE,
          url: `https://api.cal.com/v1/hooks/${data.id}`,
          queryParams: {
            apiKey: context.propsValue.api_key!
          }
        }
  
        const response = await httpClient.sendRequest(request)
        console.debug("trigger.onDisable", response)
      } else {
        console.debug(`trigger 'cal_com_trigger_${name}' not found`)
      }
    },
    async run(context) {
      console.debug("trigger running", context)
      return [context.payload.body]
    }
  })

interface WebhookInformation {
  id: string,
  userId: number,
  eventTypeId?: null | string,
  payloadTemplate?: null | string,
  eventTriggers: WebhookTrigger[],
  appId?: null | string,
  subscriberUrl: string
}

interface WebhookResponseBody {
  webhook: WebhookInformation,
  message: string
}