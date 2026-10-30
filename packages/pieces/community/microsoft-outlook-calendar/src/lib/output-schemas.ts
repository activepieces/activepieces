import { OutputSchema } from '@activepieces/pieces-framework';

const emailAddressFields: OutputSchema['fields'] = [
  { key: 'name', label: 'Name' },
  { key: 'address', label: 'Email', format: 'email' },
];

const dateTimeZoneFields: OutputSchema['fields'] = [
  { key: 'dateTime', label: 'Date and Time', format: 'datetime' },
  { key: 'timeZone', label: 'Time Zone' },
];

const locationFields: OutputSchema['fields'] = [
  { key: 'displayName', label: 'Name' },
  { key: 'locationType', label: 'Location Type' },
  { key: 'address', label: 'Address' },
  { key: 'coordinates', label: 'Coordinates' },
];

const eventLocationFields: OutputSchema['fields'] = [
  ...locationFields,
  { key: 'uniqueId', label: 'Unique ID' },
  { key: 'uniqueIdType', label: 'Unique ID Type' },
];

const responseStatusFields: OutputSchema['fields'] = [
  { key: 'response', label: 'Response' },
  { key: 'time', label: 'Responded At', format: 'datetime' },
];

const eventFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Event ID' },
  { key: 'subject', label: 'Subject' },
  { key: 'bodyPreview', label: 'Body Preview' },
  {
    key: 'body',
    label: 'Body',
    children: [
      { key: 'contentType', label: 'Content Type' },
      { key: 'content', label: 'Content', format: 'html' },
    ],
  },
  { key: 'start', label: 'Start', children: dateTimeZoneFields },
  { key: 'end', label: 'End', children: dateTimeZoneFields },
  { key: 'isAllDay', label: 'All Day', format: 'boolean' },
  { key: 'originalStartTimeZone', label: 'Original Start Time Zone' },
  { key: 'originalEndTimeZone', label: 'Original End Time Zone' },
  { key: 'location', label: 'Location', children: locationFields },
  { key: 'locations', label: 'Locations', labelKey: 'displayName', listItems: eventLocationFields },
  {
    key: 'organizer',
    label: 'Organizer',
    children: [{ key: 'emailAddress', label: 'Email Address', children: emailAddressFields }],
  },
  {
    key: 'attendees',
    label: 'Attendees',
    listItems: [
      { key: 'type', label: 'Type' },
      { key: 'status', label: 'Status', children: responseStatusFields },
      { key: 'emailAddress', label: 'Email Address', children: emailAddressFields },
    ],
  },
  { key: 'responseStatus', label: 'My Response', children: responseStatusFields },
  { key: 'responseRequested', label: 'Response Requested', format: 'boolean' },
  { key: 'isOrganizer', label: 'I Am Organizer', format: 'boolean' },
  { key: 'isCancelled', label: 'Cancelled', format: 'boolean' },
  { key: 'isDraft', label: 'Draft', format: 'boolean' },
  { key: 'type', label: 'Event Type' },
  { key: 'seriesMasterId', label: 'Series Master ID' },
  { key: 'occurrenceId', label: 'Occurrence ID' },
  {
    key: 'recurrence',
    label: 'Recurrence',
    children: [
      {
        key: 'pattern',
        label: 'Pattern',
        children: [
          { key: 'type', label: 'Type' },
          { key: 'interval', label: 'Interval', format: 'number' },
          { key: 'month', label: 'Month', format: 'number' },
          { key: 'dayOfMonth', label: 'Day of Month', format: 'number' },
          { key: 'daysOfWeek', label: 'Days of Week' },
          { key: 'firstDayOfWeek', label: 'First Day of Week' },
          { key: 'index', label: 'Week Index' },
        ],
      },
      {
        key: 'range',
        label: 'Range',
        children: [
          { key: 'type', label: 'Type' },
          { key: 'startDate', label: 'Start Date', format: 'date' },
          { key: 'endDate', label: 'End Date', format: 'date' },
          { key: 'recurrenceTimeZone', label: 'Time Zone' },
          { key: 'numberOfOccurrences', label: 'Number of Occurrences', format: 'number' },
        ],
      },
    ],
  },
  { key: 'categories', label: 'Categories' },
  { key: 'importance', label: 'Importance' },
  { key: 'sensitivity', label: 'Sensitivity' },
  { key: 'showAs', label: 'Show As' },
  { key: 'isReminderOn', label: 'Reminder On', format: 'boolean' },
  { key: 'reminderMinutesBeforeStart', label: 'Reminder Minutes Before Start', format: 'number' },
  { key: 'hasAttachments', label: 'Has Attachments', format: 'boolean' },
  { key: 'allowNewTimeProposals', label: 'Allows New Time Proposals', format: 'boolean' },
  { key: 'hideAttendees', label: 'Attendees Hidden', format: 'boolean' },
  { key: 'isOnlineMeeting', label: 'Online Meeting', format: 'boolean' },
  { key: 'onlineMeetingProvider', label: 'Online Meeting Provider' },
  { key: 'onlineMeetingUrl', label: 'Online Meeting URL', format: 'url' },
  { key: 'onlineMeeting', label: 'Online Meeting Details', children: [{ key: 'joinUrl', label: 'Join URL', format: 'url' }] },
  { key: 'webLink', label: 'Outlook Link', format: 'url' },
  { key: 'iCalUId', label: 'iCalendar UID' },
  { key: 'uid', label: 'UID' },
  { key: 'transactionId', label: 'Transaction ID' },
  { key: 'changeKey', label: 'Change Key' },
  { key: '@odata.etag', label: 'ETag', value: "['@odata.etag']" },
  { key: 'createdDateTime', label: 'Created At', format: 'datetime' },
  { key: 'lastModifiedDateTime', label: 'Last Modified At', format: 'datetime' },
];

const eventFieldsWithoutListDetails: OutputSchema['fields'] = eventFields.map((field) =>
  field.key === 'attendees' || field.key === 'locations' ? { key: field.key, label: field.label } : field,
);

const calendarFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Calendar ID' },
  { key: 'name', label: 'Name' },
  { key: 'color', label: 'Color' },
  { key: 'hexColor', label: 'Hex Color' },
  { key: 'isDefaultCalendar', label: 'Default Calendar', format: 'boolean' },
  { key: 'owner', label: 'Owner', children: emailAddressFields },
  { key: 'canEdit', label: 'Can Edit', format: 'boolean' },
  { key: 'canShare', label: 'Can Share', format: 'boolean' },
  { key: 'canViewPrivateItems', label: 'Can View Private Items', format: 'boolean' },
  { key: 'isRemovable', label: 'Removable', format: 'boolean' },
  { key: 'isTallyingResponses', label: 'Tallies Responses', format: 'boolean' },
  { key: 'allowedOnlineMeetingProviders', label: 'Allowed Online Meeting Providers' },
  { key: 'defaultOnlineMeetingProvider', label: 'Default Online Meeting Provider' },
  { key: 'groupClassId', label: 'Calendar Group Class ID' },
  { key: 'changeKey', label: 'Change Key' },
];

const calendarGroupFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Calendar Group ID' },
  { key: 'name', label: 'Name' },
  { key: 'classId', label: 'Class ID' },
  { key: 'changeKey', label: 'Change Key' },
];

const attachmentFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Attachment ID' },
  { key: 'name', label: 'File Name' },
  { key: 'contentType', label: 'Content Type' },
  { key: 'size', label: 'Size', format: 'filesize' },
  { key: 'isInline', label: 'Inline', format: 'boolean' },
  { key: 'lastModifiedDateTime', label: 'Last Modified At', format: 'datetime' },
];

const permissionFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Permission ID' },
  { key: 'emailAddress', label: 'Shared With', children: emailAddressFields },
  { key: 'role', label: 'Role' },
  { key: 'allowedRoles', label: 'Allowed Roles' },
  { key: 'isInsideOrganization', label: 'Inside Organization', format: 'boolean' },
  { key: 'isRemovable', label: 'Removable', format: 'boolean' },
];

const nextLinkField: OutputSchema['fields'][number] = {
  key: '@odata.nextLink',
  label: 'Next Page URL',
  value: "['@odata.nextLink']",
  format: 'url',
};

export const outlookCalendarSuccessOutputSchema: OutputSchema = {
  fields: [{ key: 'success', label: 'Success', format: 'boolean' }],
};

export const outlookCalendarEventOutputSchema: OutputSchema = {
  fields: eventFields,
};

export const outlookCalendarCreatedEventOutputSchema: OutputSchema = {
  fields: eventFieldsWithoutListDetails,
};

export const outlookCalendarEventListOutputSchema: OutputSchema = {
  fields: [{ key: 'value', label: 'Events', labelKey: 'subject', listItems: eventFields }, nextLinkField],
};

export const outlookCalendarCalendarEventListOutputSchema: OutputSchema = {
  fields: [{ key: 'value', label: 'Events', labelKey: 'subject', listItems: eventFields }],
};

export const outlookCalendarEventInstanceListOutputSchema: OutputSchema = {
  fields: [
    { key: 'value', label: 'Occurrences', labelKey: 'subject', listItems: eventFieldsWithoutListDetails },
    nextLinkField,
  ],
};

export const outlookCalendarEventDeltaOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'value',
      label: 'Changed Events',
      labelKey: 'subject',
      listItems: [
        ...eventFieldsWithoutListDetails,
        {
          key: '@removed',
          label: 'Removed',
          value: "['@removed']",
          children: [{ key: 'reason', label: 'Removal Reason' }],
        },
      ],
    },
    nextLinkField,
    { key: '@odata.deltaLink', label: 'Delta URL', value: "['@odata.deltaLink']", format: 'url' },
  ],
};

export const outlookCalendarCalendarOutputSchema: OutputSchema = {
  fields: calendarFields,
};

export const outlookCalendarCalendarListOutputSchema: OutputSchema = {
  fields: [{ key: 'value', label: 'Calendars', labelKey: 'name', listItems: calendarFields }, nextLinkField],
};

export const outlookCalendarCalendarGroupOutputSchema: OutputSchema = {
  fields: calendarGroupFields,
};

export const outlookCalendarCalendarGroupListOutputSchema: OutputSchema = {
  fields: [
    { key: 'value', label: 'Calendar Groups', labelKey: 'name', listItems: calendarGroupFields },
    nextLinkField,
  ],
};

export const outlookCalendarAttachmentOutputSchema: OutputSchema = {
  fields: [
    ...attachmentFields,
    { key: 'contentBytes', label: 'Content (Base64)' },
    { key: 'contentId', label: 'Content ID' },
    { key: 'contentLocation', label: 'Content Location' },
  ],
};

export const outlookCalendarAttachmentListOutputSchema: OutputSchema = {
  fields: [{ key: 'value', label: 'Attachments', labelKey: 'name', listItems: attachmentFields }],
};

export const outlookCalendarExtensionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Extension ID' },
    { key: 'extensionName', label: 'Extension Name' },
  ],
};

export const outlookCalendarReminderListOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'value',
      label: 'Reminders',
      labelKey: 'eventSubject',
      listItems: [
        { key: 'eventId', label: 'Event ID' },
        { key: 'eventSubject', label: 'Event Subject' },
        { key: 'eventStartTime', label: 'Event Start', children: dateTimeZoneFields },
        { key: 'eventEndTime', label: 'Event End', children: dateTimeZoneFields },
        { key: 'eventLocation', label: 'Event Location', children: locationFields },
        { key: 'reminderFireTime', label: 'Reminder Time', children: dateTimeZoneFields },
        { key: 'eventWebLink', label: 'Event Outlook Link', format: 'url' },
        { key: 'changeKey', label: 'Change Key' },
      ],
    },
  ],
};

export const outlookCalendarPermissionOutputSchema: OutputSchema = {
  fields: permissionFields,
};

export const outlookCalendarPermissionListOutputSchema: OutputSchema = {
  fields: [{ key: 'value', label: 'Permissions' }],
};

export const outlookCalendarAllowedRolesOutputSchema: OutputSchema = {
  fields: [{ key: 'value', label: 'Allowed Roles' }],
};

export const outlookCalendarScheduleOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'value',
      label: 'Schedules',
      labelKey: 'scheduleId',
      listItems: [
        { key: 'scheduleId', label: 'Email', format: 'email' },
        { key: 'availabilityView', label: 'Availability View' },
        { key: 'scheduleItems', label: 'Busy Items' },
        {
          key: 'workingHours',
          label: 'Working Hours',
          children: [
            { key: 'daysOfWeek', label: 'Days of Week' },
            { key: 'startTime', label: 'Start Time' },
            { key: 'endTime', label: 'End Time' },
            { key: 'timeZone', label: 'Time Zone', children: [{ key: 'name', label: 'Name' }] },
          ],
        },
      ],
    },
  ],
};

export const outlookCalendarTimeZoneListOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'value',
      label: 'Time Zones',
      labelKey: 'displayName',
      listItems: [
        { key: 'alias', label: 'Time Zone ID' },
        { key: 'displayName', label: 'Display Name' },
      ],
    },
  ],
};
