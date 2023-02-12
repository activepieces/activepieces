import { AuthenticationType } from "../../../common/authentication/core/authentication-type";
import { httpClient } from "../../../common/http/core/http-client";
import { HttpMethod } from "../../../common/http/core/http-method";
import { HttpRequest } from "../../../common/http/core/http-request";
import { createAction } from "../../../framework/action/action";
import { Property } from "../../../framework/property";
import { EventBody, EventCaptureResponse } from "../common/models";

export const posthogCreateEvent = createAction({
  name: 'posthog_event_create',
  displayName: 'Create a posthog event',
  description: 'Create an event inside a project',
  sampleData: {
    "status": 1
  },
  props: {
    api_key: Property.ShortText({ 
      displayName: "API Key", 
      description: "Your personal or project API key" , 
      required: true
    }),
    properties: Property.Object({ 
      displayName: "Project ID", 
      description: "The project id." , 
      required: false
    }),
    context: Property.Object({ 
      displayName: "Context", 
      description: "The context," , 
      required: false
    }),
    message_id: Property.ShortText({ 
      displayName: "Message ID", 
      description: "The message id," , 
      required: false
    }),
    category: Property.ShortText({ 
      displayName: "Category", 
      description: "The event category." , 
      required: false
    })
  },
  async run(context) {
    const body: EventBody = {
      type: "capture",
      event: "$event",
      api_key: context.propsValue.api_key!,
      properties: context.propsValue.properties,
      context: context.propsValue.context,
      messageId: context.propsValue.message_id,
      category: context.propsValue.category,
    }

    const request: HttpRequest<EventBody> = {
      method: HttpMethod.POST,
      url: `https://app.posthog.com/capture/`,
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.propsValue.api_key!
      }
    }

    const result = await httpClient.sendRequest<EventCaptureResponse>(request)
    console.debug("Event creation response", result)
    return result
  }
});