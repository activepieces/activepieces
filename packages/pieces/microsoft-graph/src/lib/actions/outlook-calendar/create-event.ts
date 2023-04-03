import { AuthenticationType, createAction, httpClient, HttpMethod, Property } from "@activepieces/framework";
import { commonProps } from "../../common/props";

/**
 *  Reference:
 *  - https://learn.microsoft.com/en-us/outlook/rest/compare-graph
 *  - https://learn.microsoft.com/en-us/graph/api/user-post-events?view=graph-rest-1.0&tabs=http
 */

export const outlookCalendarCreateEvent = createAction({
  name: 'outlook_calendar_create_event',
  description: 'The Outlook API now uses Graph API. Create a Calendar event.',
  displayName: 'Create Calendar Event',
  props: {
    authentication: commonProps.authentication(['Calendars.ReadWrite']),
    subject: Property.ShortText({
      displayName: 'Event Subject',
      description: 'The event subject',
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Event Message',
      description: 'The event message',
      required: true,
    }),
    start: Property.ShortText({
      displayName: 'Start time',
      description: 'The event start time (ISO Format e.g. 2017-04-15T12:00:00)',
      required: true,
    }),
    end: Property.ShortText({
      displayName: 'End time',
      description: 'The event end time (ISO Format e.g. 2017-04-15T12:00:00)',
      required: true,
    }),
    location: Property.ShortText({
      displayName: 'Location',
      description: 'The event location.',
      required: true,
    }),
    attendees: Property.Array({
      displayName: 'Attendee Emails',
      description: 'Email addresses of attendees. No commas.',
      required: true,
    }),
    timezone: Property.ShortText({
      displayName: 'Timezone',
      description: 'Timezone to create Event',
      required: false,
      defaultValue: 'UTC'
    }),
    transaction_id: Property.ShortText({
      displayName: 'Transaction Id',
      description: 'Transaction Id',
      required: false
    })
  },
  sampleData: {
    "@odata.context": "https://graph.microsoft.com/v1.0/$metadata#users('cd209b0b-3f83-4c35-82d2-d88a61820480')/events/$entity",
    "@odata.etag": "W/\"ZlnW4RIAV06KYYwlrfNZvQAALfZeRQ==\"",
    "id": "AAMkAGI1AAAt9AHjAAA=",
    "createdDateTime": "2017-04-15T03:00:50.7579581Z",
    "lastModifiedDateTime": "2017-04-15T03:00:51.245372Z",
    "changeKey": "ZlnW4RIAV06KYYwlrfNZvQAALfZeRQ==",
    "categories": [

    ],
    "originalStartTimeZone": "Pacific Standard Time",
    "originalEndTimeZone": "Pacific Standard Time",
    "iCalUId": "040000008200E00074C5B7101A82E00800000000DA2B357D94B5D201000000000000000010000000EC4597557F0CB34EA4CC2887EA7B17C3",
    "reminderMinutesBeforeStart": 15,
    "isReminderOn": true,
    "hasAttachments": false,
    "hideAttendees": false,
    "subject": "Let's go brunch",
    "bodyPreview": "Does noon work for you?",
    "importance": "normal",
    "sensitivity": "normal",
    "isAllDay": false,
    "isCancelled": false,
    "isDraft": false,
    "isOrganizer": true,
    "responseRequested": true,
    "seriesMasterId": null,
    "transactionId": "7E163156-7762-4BEB-A1C6-729EA81755A7",
    "showAs": "busy",
    "type": "singleInstance",
    "webLink": "https://outlook.office365.com/owa/?itemid=AAMkAGI1AAAt9AHjAAA%3D&exvsurl=1&path=/calendar/item",
    "onlineMeetingUrl": null,
    "isOnlineMeeting": false,
    "onlineMeetingProvider": "unknown",
    "onlineMeeting": null,
    "allowNewTimeProposals": true,
    "responseStatus": {
      "response": "organizer",
      "time": "0001-01-01T00:00:00Z"
    },
    "body": {
      "contentType": "html",
      "content": "<html><head></head><body>Does late morning work for you?</body></html>"
    },
    "start": {
      "dateTime": "2017-04-15T11:00:00.0000000",
      "timeZone": "Pacific Standard Time"
    },
    "end": {
      "dateTime": "2017-04-15T12:00:00.0000000",
      "timeZone": "Pacific Standard Time"
    },
    "location": {
      "displayName": "Harry's Bar",
      "locationType": "default",
      "uniqueId": "Harry's Bar",
      "uniqueIdType": "private"
    },
    "locations": [
      {
        "displayName": "Harry's Bar",
        "locationType": "default",
        "uniqueIdType": "unknown"
      }
    ],
    "recurrence": null,
    "attendees": [
      {
        "type": "required",
        "status": {
          "response": "none",
          "time": "0001-01-01T00:00:00Z"
        },
        "emailAddress": {
          "name": "Samantha Booth",
          "address": "samanthab@contoso.onmicrosoft.com"
        }
      }
    ],
    "organizer": {
      "emailAddress": {
        "name": "Dana Swope",
        "address": "danas@contoso.onmicrosoft.com"
      }
    }
  },
  run: async ({ propsValue }) => {
    const body: Record<string, unknown> = {
      subject: propsValue.subject,
      body: {
        contentType: "HTML",
        content: propsValue.message
      },
      start: {
        dateTime: propsValue.start,
        timeZone: propsValue.timezone
      },
      end: {
        dateTime: propsValue.end,
        timeZone: propsValue.timezone
      },
      location: {
        displayName: propsValue.location
      },
      attendees: propsValue.attendees.map(attendee => (
        {
          emailAddress: {
            address: attendee,
            name: attendee
          },
          type: "required"
        }
      )),
      allowNewTimeProposals: true
    }

    if (propsValue.transaction_id)
      body['transactionId'] = propsValue.transaction_id

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `https://graph.microsoft.com/v1.0/me/events`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: propsValue.authentication['access_token'],
      },
      headers: {
        "Prefer": `outlook.timezone="${propsValue.timezone}"`,
        "Content-type": 'application/json'
      },
      body: body
    })

    console.debug("send message response", response)

    if (response.status === 200) {
      return response.body
    }

    return response
  }
})