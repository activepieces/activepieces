import { Property, createAction, HttpRequest, HttpMethod, httpClient, AuthenticationType } from "@activepieces/framework";
import { ProjectCreateRequest, ProjectCreateResponse } from "../common/models";

export const posthogCreateProject = createAction({
  name: 'create_project',
  displayName: 'Create Project',
  description: 'Create a posthog project',
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
    api_key: Property.SecretText({ 
      displayName: "Personal API Key", 
      description: "Check https://posthog.com/docs/api/overview#personal-api-keys-recommended for more information." , 
      required: true
    }),
    name: Property.ShortText({ 
      displayName: "Name", 
      description: "Project Name" , 
      required: false
    }),
    slack_incoming_webhook: Property.ShortText({ 
      displayName: "Slack Incoming Webhook", 
      description: "Slack incoming webhook" , 
      required: false
    }),
    anonymize_ips: Property.Checkbox({ 
      displayName: "Anonymize IPs", 
      description: "Whether to anonymize incoming IP addresses." , 
      required: false
    }),
    is_demo: Property.Checkbox({ 
      displayName: "Is demo project", 
      description: "If this is a demo project" , 
      required: false
    })
  },
  async run(context) {
    const body: ProjectCreateRequest = {
      ...context.propsValue,
    }

    const request: HttpRequest<ProjectCreateRequest> = {
      method: HttpMethod.POST,
      url: `https://app.posthog.com/api/projects/`,
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.propsValue.api_key!
      }
    }

    const result = await httpClient.sendRequest<ProjectCreateResponse>(request)
    console.debug("Project creation response", result)

    if (result.status === 200) {
      return result.body
    }
    
    return result
  }
});