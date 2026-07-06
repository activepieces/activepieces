import { OutputSchema } from '@activepieces/pieces-framework';

export const eventOutputSchema: OutputSchema = {
  "fields": [
    {
      "key": "summary",
      "label": "Title"
    },
    {
      "key": "status",
      "label": "Status"
    },
    {
      "key": "htmlLink",
      "label": "Event Link",
      "format": "url"
    },
    {
      "key": "id",
      "label": "Event ID"
    },
    {
      "key": "eventType",
      "label": "Event Type"
    },
    {
      "key": "start",
      "label": "Start",
      "children": [
        {
          "key": "dateTime",
          "label": "Start Time",
          "format": "datetime"
        },
        {
          "key": "timeZone",
          "label": "Time Zone"
        }
      ]
    },
    {
      "key": "end",
      "label": "End",
      "children": [
        {
          "key": "dateTime",
          "label": "End Time",
          "format": "datetime"
        },
        {
          "key": "timeZone",
          "label": "Time Zone"
        }
      ]
    },
    {
      "key": "creator",
      "label": "Creator",
      "children": [
        {
          "key": "email",
          "label": "Email",
          "format": "email"
        }
      ]
    },
    {
      "key": "organizer",
      "label": "Organizer",
      "children": [
        {
          "key": "email",
          "label": "Email",
          "format": "email"
        }
      ]
    },
    {
      "key": "created",
      "label": "Created",
      "format": "datetime"
    },
    {
      "key": "updated",
      "label": "Updated",
      "format": "datetime"
    },
    {
      "key": "iCalUID",
      "label": "iCal UID"
    }
  ]
};

export const calendarOutputSchema: OutputSchema = {
  "fields": [
    {
      "key": "summary",
      "label": "Name"
    },
    {
      "key": "description",
      "label": "Description"
    },
    {
      "key": "id",
      "label": "Calendar ID"
    },
    {
      "key": "timeZone",
      "label": "Time Zone"
    },
    {
      "key": "accessRole",
      "label": "Access Role"
    },
    {
      "key": "selected",
      "label": "Selected",
      "format": "boolean"
    },
    {
      "key": "isShared",
      "label": "Is Shared",
      "format": "boolean"
    },
    {
      "key": "calendarType",
      "label": "Calendar Type"
    },
    {
      "key": "backgroundColor",
      "label": "Background Color"
    },
    {
      "key": "foregroundColor",
      "label": "Foreground Color"
    },
    {
      "key": "colorId",
      "label": "Color ID"
    }
  ]
};

export const getEventsActionOutputSchema: OutputSchema = {
  "fields": [
    {
      "key": "status",
      "label": "Status Code"
    },
    {
      "key": "summary",
      "label": "Calendar Summary",
      "value": "body.summary"
    },
    {
      "key": "timeZone",
      "label": "Time Zone",
      "value": "body.timeZone"
    },
    {
      "key": "accessRole",
      "label": "Access Role",
      "value": "body.accessRole"
    },
    {
      "key": "updated",
      "label": "Updated",
      "value": "body.updated",
      "format": "datetime"
    },
    {
      "key": "items",
      "label": "Events",
      "value": "body.items",
      "labelKey": "summary",
      "listItems": [
        {
          "key": "summary",
          "label": "Title"
        },
        {
          "key": "status",
          "label": "Status"
        },
        {
          "key": "id",
          "label": "Event ID"
        },
        {
          "key": "eventType",
          "label": "Event Type"
        },
        {
          "key": "htmlLink",
          "label": "Event Link",
          "format": "url"
        },
        {
          "key": "startDateTime",
          "label": "Start",
          "value": "start.dateTime",
          "format": "datetime"
        },
        {
          "key": "endDateTime",
          "label": "End",
          "value": "end.dateTime",
          "format": "datetime"
        },
        {
          "key": "creatorEmail",
          "label": "Creator Email",
          "value": "creator.email",
          "format": "email"
        },
        {
          "key": "organizerEmail",
          "label": "Organizer Email",
          "value": "organizer.email",
          "format": "email"
        },
        {
          "key": "created",
          "label": "Created",
          "format": "datetime"
        },
        {
          "key": "updated",
          "label": "Updated",
          "format": "datetime"
        },
        {
          "key": "iCalUID",
          "label": "iCal UID"
        }
      ]
    }
  ]
};

export const quickEventActionOutputSchema: OutputSchema = {
  "fields": [
    {
      "key": "summary",
      "label": "Summary",
      "value": "body.summary"
    },
    {
      "key": "status",
      "label": "Status",
      "value": "body.status"
    },
    {
      "key": "id",
      "label": "Event ID",
      "value": "body.id"
    },
    {
      "key": "htmlLink",
      "label": "Event Link",
      "value": "body.htmlLink",
      "format": "url"
    },
    {
      "key": "created",
      "label": "Created",
      "value": "body.created",
      "format": "datetime"
    },
    {
      "key": "updated",
      "label": "Updated",
      "value": "body.updated",
      "format": "datetime"
    },
    {
      "key": "start",
      "label": "Start",
      "value": "body.start",
      "children": [
        {
          "key": "dateTime",
          "label": "Start Date/Time",
          "format": "datetime"
        },
        {
          "key": "timeZone",
          "label": "Time Zone"
        }
      ]
    },
    {
      "key": "end",
      "label": "End",
      "value": "body.end",
      "children": [
        {
          "key": "dateTime",
          "label": "End Date/Time",
          "format": "datetime"
        },
        {
          "key": "timeZone",
          "label": "Time Zone"
        }
      ]
    },
    {
      "key": "creator",
      "label": "Creator",
      "value": "body.creator",
      "children": [
        {
          "key": "email",
          "label": "Email",
          "format": "email"
        }
      ]
    },
    {
      "key": "organizer",
      "label": "Organizer",
      "value": "body.organizer",
      "children": [
        {
          "key": "email",
          "label": "Email",
          "format": "email"
        }
      ]
    },
    {
      "key": "eventType",
      "label": "Event Type",
      "value": "body.eventType"
    },
    {
      "key": "iCalUID",
      "label": "iCal UID",
      "value": "body.iCalUID"
    }
  ]
};

export const freeBusyActionOutputSchema: OutputSchema = {
  "fields": [
    {
      "key": "timeMin",
      "label": "Time Min",
      "format": "datetime"
    },
    {
      "key": "timeMax",
      "label": "Time Max",
      "format": "datetime"
    },
    {
      "key": "calendars",
      "label": "Calendars",
      "dynamicKey": true,
      "children": [
        {
          "key": "busy",
          "label": "Busy Periods",
          "labelKey": "start",
          "listItems": [
            {
              "key": "start",
              "label": "Start",
              "format": "datetime"
            },
            {
              "key": "end",
              "label": "End",
              "format": "datetime"
            }
          ]
        }
      ]
    }
  ]
};
