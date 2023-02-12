import { AuthenticationType } from "../../../common/authentication/core/authentication-type";
import { httpClient } from "../../../common/http/core/http-client";
import { HttpMethod } from "../../../common/http/core/http-method";
import { HttpRequest } from "../../../common/http/core/http-request";
import { createAction } from "../../../framework/action/action";
import { Property } from "../../../framework/property";
import { EventBody } from "../common/types";

export const posthogCreateEvent = createAction({
  name: 'posthog_event_create',
  displayName: 'Create a posthog event',
  description: 'Create an event inside a project',
  sampleData: {
    "id": 0,
    "uuid": "095be615-a8ad-4c33-8e9c-c7612fbf6c9f",
    "organization": "452c1a86-a0af-475b-b03f-724878b0f387",
    "api_token": "string",
    "app_urls": [
      "string"
    ],
    "name": "string",
    "slack_incoming_webhook": "string",
    "created_at": "2019-08-24T14:15:22Z",
    "updated_at": "2019-08-24T14:15:22Z",
    "anonymize_ips": true,
    "completed_snippet_onboarding": true,
    "ingested_event": true,
    "test_account_filters": {
      "property1": null,
      "property2": null
    },
    "test_account_filters_default_checked": true,
    "path_cleaning_filters": {
      "property1": null,
      "property2": null
    },
    "is_demo": true,
    "timezone": "Africa/Abidjan",
    "data_attributes": {
      "property1": null,
      "property2": null
    },
    "person_display_name_properties": [
      "string"
    ],
    "correlation_config": {
      "property1": null,
      "property2": null
    },
    "session_recording_opt_in": true,
    "capture_console_log_opt_in": true,
    "capture_performance_opt_in": true,
    "effective_membership_level": 1,
    "access_control": true,
    "has_group_types": true,
    "primary_dashboard": 0,
    "live_events_columns": [
      "string"
    ],
    "recording_domains": [
      "string"
    ],
    "person_on_events_querying_enabled": true,
    "groups_on_events_querying_enabled": true,
    "inject_web_apps": true
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
      body: body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.propsValue.api_key!
      }
    }

    const result = await httpClient.sendRequest(request)
    console.debug("Event creation response", result)
    return result
  }
});