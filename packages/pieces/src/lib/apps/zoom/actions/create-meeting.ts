import { AuthenticationType } from "../../../common/authentication/core/authentication-type";
import { httpClient } from "../../../common/http/core/http-client";
import { HttpMethod } from "../../../common/http/core/http-method";
import { HttpRequest } from "../../../common/http/core/http-request";
import { createAction } from "../../../framework/action/action";
import { Property } from "../../../framework/property";

export const zoomAuth = Property.OAuth2({
  description: "",
  displayName: 'Authentication',
  authUrl: "https://zoom.us/oauth/authorize",
  tokenUrl: "https://zoom.us/oauth/token",
  required: true,
  scope: [
    "meeting:write:admin", "meeting:write"
  ]
});

const defaults = {
  "agenda": "My Meeting",
  "default_password": false,
  "duration": 30,
  "pre_schedule": false,

  "settings": {
    "allow_multiple_devices": true,
    "approval_type": 2,
    "audio": "telephony",
    
    "calendar_type": 1,
    "close_registration": false,

    "email_notification": true,
    "host_video": true,
    "join_before_host": false,
    "meeting_authentication": true,
    "mute_upon_entry": false,
    "participant_video": false,
    "private_meeting": false,
    "registrants_confirmation_email": true,
    "registrants_email_notification": true,
    "registration_type": 1,
    "show_share_button": true,
    "host_save_video_order": true
  },

  "timezone": "UTC",
  "type": 2
}

const action = () => {
  return createAction({
    name: 'zoom_create_meeting', // Must be a unique across the piece, this shouldn't be changed.
    displayName: 'Create Zoom Meeting',
    description: 'Create a new Zoom Meeting',
    props: {
      authentication: zoomAuth,
      topic: Property.ShortText({
        displayName: "Meeting's topic",
        description: "The meeting's topic",
        required: true,
      }),
      agenda: Property.LongText({
        displayName: 'Agenda',
        description: "The meeting's agenda",
        required: false,
      }),
      password: Property.ShortText({
        displayName: 'Password',
        description: "The password required to join the meeting. By default, a password can only have a maximum length of 10 characters and only contain alphanumeric characters and the @, -, _, and * characters.",
        required: false,
      }),
      start_time: Property.ShortText({
        displayName: 'Start Time',
        description: 'Meeting start date-time',
        required: false,
      }),
      pre_schedule: Property.Checkbox({
        displayName: 'Pre Schedule',
        description: "Whether the prescheduled meeting was created via the GSuite app.",
        required: false,
      }),
      schedule_for: Property.ShortText({
        displayName: 'Schedule for',
        description: 'The email address or user ID of the user to schedule a meeting for.',
        required: false,
      }),
      join_url: Property.LongText({
        displayName: 'Join URL',
        description: 'URL for participants to join the meeting.',
        required: false,
      })
    },
    sampleData: {
      "agenda": "My Meeting",
      "default_password": false,
      "duration": 60,
      "password": "123456",
      "pre_schedule": false,
      "recurrence": {
        "end_date_time": "2022-04-02T15:59:00Z",
        "end_times": 7,
        "monthly_day": 1,
        "monthly_week": 1,
        "monthly_week_day": 1,
        "repeat_interval": 1,
        "type": 1,
        "weekly_days": "1"
      },
      "schedule_for": "jchill@example.com",
      "settings": {
        "additional_data_center_regions": [
          "TY"
        ],
        "allow_multiple_devices": true,
        "alternative_hosts": "jchill@example.com;thill@example.com",
        "alternative_hosts_email_notification": true,
        "approval_type": 2,
        "approved_or_denied_countries_or_regions": {
          "approved_list": [
            "CX"
          ],
          "denied_list": [
            "CA"
          ],
          "enable": true,
          "method": "approve"
        },
        "audio": "telephony",
        "authentication_domains": "example.com",
        "authentication_exception": [
          {
            "email": "jchill@example.com",
            "name": "Jill Chill"
          }
        ],
        "authentication_option": "signIn_D8cJuqWVQ623CI4Q8yQK0Q",
        "auto_recording": "cloud",
        "breakout_room": {
          "enable": true,
          "rooms": [
            {
              "name": "room1",
              "participants": [
                "jchill@example.com"
              ]
            }
          ]
        },
        "calendar_type": 1,
        "close_registration": false,
        "contact_email": "jchill@example.com",
        "contact_name": "Jill Chill",
        "email_notification": true,
        "encryption_type": "enhanced_encryption",
        "focus_mode": true,
        "global_dial_in_countries": [
          "US"
        ],
        "host_video": true,
        "jbh_time": 0,
        "join_before_host": false,
        "language_interpretation": {
          "enable": true,
          "interpreters": [
            {
              "email": "interpreter@example.com",
              "languages": "US,FR"
            }
          ]
        },
        "meeting_authentication": true,
        "meeting_invitees": [
          {
            "email": "jchill@example.com"
          }
        ],
        "mute_upon_entry": false,
        "participant_video": false,
        "private_meeting": false,
        "registrants_confirmation_email": true,
        "registrants_email_notification": true,
        "registration_type": 1,
        "show_share_button": true,
        "use_pmi": false,
        "waiting_room": false,
        "watermark": false,
        "host_save_video_order": true,
        "alternative_host_update_polls": true
      },
      "start_time": "2022-03-25T07:32:55Z",
      "template_id": "Dv4YdINdTk+Z5RToadh5ug==",
      "timezone": "America/Los_Angeles",
      "topic": "My Meeting",
      "tracking_fields": [
        {
          "field": "field1",
          "value": "value1"
        }
      ],
      "type": 2
    },

    async run(context) {
      const body = {
        ...defaults,
        ...context.propsValue
      }
      delete body['authentication']

      const request: HttpRequest<any> = {
        method: HttpMethod.POST,
        url: `https://api.zoom.us/v2/users/me/meetings`,
        body: body,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.propsValue.authentication!.access_token
        },
        queryParams: {},
      };

      const result = await httpClient.sendRequest(request)
      console.debug("Meeting creation response", result)

      if (result.status === 201) {
        return result.body;
      } else {
        return result;
      }
    }
  })
}

export const zoomCreateMeeting = action();