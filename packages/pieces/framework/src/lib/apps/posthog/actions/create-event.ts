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
      displayName: "Project API key", 
      description: "Your project API key" , 
      required: true
    }),
    event_type: Property.Dropdown({
      displayName: "Event type",
      required: true,
      refreshers: [],
      options: async (props) => {
        return {
          options: [
            {label: "Alias", value: {event: "$create_alias", type: "alias"}},
            {label: "Capture", value: {event: "$event", type: "capture"}},
            {label: "Identify", value: {event: "$identify", type: "screen"}},
            {label: "Page", value: {event: "$page", type: "page"}},
            {label: "Screen", value: {event: "$screen", type: "screen"}},
          ]
        };
      }
    }),
    distinct_id: Property.ShortText({ 
      displayName: "Distinct Id", 
      description: "User's Distinct Id" , 
      required: true
    }),
    properties: Property.Object({ 
      displayName: "Properties", 
      description: "The event properties" , 
      required: false
    }),
    context: Property.Object({ 
      displayName: "Context", 
      description: "The event context," , 
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
    }),
  },
  async run(context) {
    let body: EventBody = {
      ...context.propsValue.event_type,
      api_key: context.propsValue.api_key!,
      messageId: context.propsValue.message_id,
      context: context.propsValue.context || {},
      properties: context.propsValue.properties || {},
      distinct_id: context.propsValue.distinct_id!,
      category: context.propsValue.category
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

    if (result.status === 200) {
      return result.body
    }

    return result
  }
});