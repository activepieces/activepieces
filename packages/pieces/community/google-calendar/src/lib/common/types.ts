export enum GoogleWatchType {
  WEBHOOK = 'web_hook',
}

export enum GoogleCalendarKind {
  CALENDAR_LIST = 'calendar#calendarList',
  CALENDAR_ENTRY = 'calendar#calendarListEntry',
  CALENDAR_EVENT = 'calendar#event',
  CALENDAR_EVENT_LIST = 'calendar#events',
  EVENT_WATCH = 'api#channel',
  CALENDAR_COLORS = 'calendar#colors',
}

export interface CalendarList {
  kind: GoogleCalendarKind.CALENDAR_LIST;
  etag: string;
  nextPageToken: string;
  nextSyncToken: string;
  items: CalendarObject[];
}

export interface CalendarObject {
  kind: GoogleCalendarKind.CALENDAR_ENTRY;
  etag: string;
  id: string;
  summary: string;
  description: string;
  location: string;
  timeZone: string;
  summaryOverride: string;
  colorId: string;
  backgroundColor: string;
  foregroundColor: string;
  hidden: boolean;
  selected: boolean;
  accessRole: string;
  defaultReminders: [
    {
      method: string;
      minutes: number;
    }
  ];
  notificationSettings: {
    notifications: [
      {
        type: string;
        method: string;
      }
    ];
  };
  primary: boolean;
  deleted: boolean;
  conferenceProperties: {
    allowedConferenceSolutionTypes: string[];
  };
}

export interface GoogleWatchResponse {
  kind: GoogleCalendarKind.EVENT_WATCH;
  id: string;
  resourceId: string;
  resourceUri: string;
  token: string;
  expiration: number;
}

interface Attendee {
  id: string;
  email: string;
  displayName: string;
  organizer: boolean;
  self: boolean;
  resource: boolean;
  optional: boolean;
  responseStatus: string;
  comment: string;
  additionalGuests: BigInteger;
}

export interface GoogleCalendarEvent {
  kind: GoogleCalendarKind.CALENDAR_EVENT;
  etag: string;
  id: string;
  status: string;
  htmlLink: string;
  created: string;
  updated: string;
  summary: string;
  description: string;
  location: string;
  colorId: string;
  creator: {
    id: string;
    email: string;
    displayName: string;
    self: boolean;
  };
  organizer: {
    id: string;
    email: string;
    displayName: string;
    self: boolean;
  };
  start: {
    date: Date;
    dateTime: Date;
    timeZone: string;
  };
  end: {
    date: Date;
    dateTime: Date;
    timeZone: string;
  };
  endTimeUnspecified: boolean;
  recurrence: [string];
  recurringEventId: string;
  originalStartTime: {
    date: Date;
    dateTime: Date;
    timeZone: string;
  };
  transparency: string;
  visibility: string;
  iCalUID: string;
  sequence: BigInteger;
  attendees: Attendee[];
  attendeesOmitted: boolean;
  extendedProperties: {
    private: {
      key: string;
    };
    shared: {
      key: string;
    };
  };
  hangoutLink: string;
  conferenceData: {
    createRequest: {
      requestId: string;
      conferenceSolutionKey: {
        type: string;
      };
      status: {
        statusCode: string;
      };
    };
    entryPoints: [
      {
        entryPointType: string;
        uri: string;
        label: string;
        pin: string;
        accessCode: string;
        meetingCode: string;
        passcode: string;
        password: string;
      }
    ];
    conferenceSolution: {
      key: {
        type: string;
      };
      name: string;
      iconUri: string;
    };
    conferenceId: string;
    signature: string;
    notes: string;
  };
  gadget: {
    type: string;
    title: string;
    link: string;
    iconLink: string;
    width: BigInteger;
    height: BigInteger;
    display: string;
    preferences: {
      key: string;
    };
  };
  anyoneCanAddSelf: boolean;
  guestsCanInviteOthers: boolean;
  guestsCanModify: boolean;
  guestsCanSeeOtherGuests: boolean;
  privateCopy: boolean;
  locked: boolean;
  reminders: {
    useDefault: boolean;
    overrides: [
      {
        method: string;
        minutes: BigInteger;
      }
    ];
  };
  source: {
    url: string;
    title: string;
  };
  attachments: [
    {
      fileUrl: string;
      title: string;
      mimeType: string;
      iconLink: string;
      fileId: string;
    }
  ];
  eventType: string;
}

export interface GoogleCalendarEventList {
  kind: GoogleCalendarKind.CALENDAR_EVENT_LIST;
  etag: string;
  summary: string;
  description: string;
  updated: number;
  timeZone: string;
  accessRole: string;
  defaultReminders: [
    {
      method: string;
      minutes: BigInteger;
    }
  ];
  nextPageToken: string;
  nextSyncToken: string;
  items: GoogleCalendarEvent[];
}

export interface GetColorsResponse {
  kind: GoogleCalendarKind.CALENDAR_COLORS;
  calendar: {
    [s: string]: {
      background: string;
      foreground: string;
    };
  };
  event: {
    [s: string]: {
      background: string;
      foreground: string;
    };
  };
}
