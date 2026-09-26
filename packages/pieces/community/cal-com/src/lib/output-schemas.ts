import { OutputSchema } from '@activepieces/pieces-framework';

const eventTypeFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Event Type ID' },
  { key: 'title', label: 'Title' },
  { key: 'slug', label: 'Slug' },
  { key: 'description', label: 'Description' },
  { key: 'lengthInMinutes', label: 'Length (Minutes)', format: 'number' },
  { key: 'hidden', label: 'Hidden', format: 'boolean' },
  { key: 'scheduleId', label: 'Schedule ID', format: 'number' },
  { key: 'bookingUrl', label: 'Booking URL', format: 'url' },
  { key: 'price', label: 'Price', format: 'number' },
  { key: 'currency', label: 'Currency' },
];

const bookingFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Booking ID' },
  { key: 'uid', label: 'Booking UID' },
  { key: 'title', label: 'Title' },
  { key: 'description', label: 'Description' },
  { key: 'status', label: 'Status' },
  { key: 'start', label: 'Start Time', format: 'datetime' },
  { key: 'end', label: 'End Time', format: 'datetime' },
  { key: 'duration', label: 'Duration (Minutes)', format: 'number' },
  { key: 'location', label: 'Location', format: 'url' },
  { key: 'meetingUrl', label: 'Meeting URL', format: 'url' },
  { key: 'cancellationReason', label: 'Cancellation Reason' },
  { key: 'eventTypeId', label: 'Event Type ID', format: 'number' },
  {
    key: 'eventType',
    label: 'Event Type',
    children: [
      { key: 'id', label: 'Event Type ID' },
      { key: 'slug', label: 'Slug' },
    ],
  },
  {
    key: 'hosts',
    label: 'Hosts',
    labelKey: 'name',
    listItems: [
      { key: 'id', label: 'Host ID' },
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email', format: 'email' },
      { key: 'timeZone', label: 'Timezone' },
    ],
  },
  {
    key: 'attendees',
    label: 'Attendees',
    labelKey: 'name',
    listItems: [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email', format: 'email' },
      { key: 'timeZone', label: 'Timezone' },
      { key: 'absent', label: 'Absent', format: 'boolean' },
    ],
  },
];

const scheduleFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Schedule ID' },
  { key: 'name', label: 'Name' },
  { key: 'timeZone', label: 'Timezone' },
  { key: 'isDefault', label: 'Is Default', format: 'boolean' },
  {
    key: 'availability',
    label: 'Availability',
    labelKey: 'startTime',
    listItems: [
      { key: 'days', label: 'Days' },
      { key: 'startTime', label: 'Start Time' },
      { key: 'endTime', label: 'End Time' },
    ],
  },
  {
    key: 'overrides',
    label: 'Date Overrides',
    labelKey: 'date',
    listItems: [
      { key: 'date', label: 'Date', format: 'date' },
      { key: 'startTime', label: 'Start Time' },
      { key: 'endTime', label: 'End Time' },
    ],
  },
];

const profileFields: OutputSchema['fields'] = [
  { key: 'id', label: 'User ID' },
  { key: 'username', label: 'Username' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'bio', label: 'Bio' },
  { key: 'timeZone', label: 'Timezone' },
  { key: 'weekStart', label: 'Week Start' },
  { key: 'timeFormat', label: 'Time Format', format: 'number' },
  { key: 'defaultScheduleId', label: 'Default Schedule ID', format: 'number' },
  { key: 'avatarUrl', label: 'Avatar URL', format: 'image' },
];

export const listEventTypesActionOutputSchema: OutputSchema = {
  itemLabel: '{title}',
  fields: [
    { key: 'eventTypes', label: 'Event Types', value: '', listItems: eventTypeFields },
  ],
};

export const eventTypeActionOutputSchema: OutputSchema = {
  fields: eventTypeFields,
};

export const deleteEventTypeActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Event Type ID' },
    { key: 'title', label: 'Title' },
    { key: 'slug', label: 'Slug' },
    { key: 'lengthInMinutes', label: 'Length (Minutes)', format: 'number' },
  ],
};

export const listBookingsActionOutputSchema: OutputSchema = {
  itemLabel: '{title}',
  fields: [
    { key: 'bookings', label: 'Bookings', value: '', listItems: bookingFields },
  ],
};

export const bookingActionOutputSchema: OutputSchema = {
  fields: bookingFields,
};

export const addAttendeeActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Attendee ID' },
    { key: 'bookingId', label: 'Booking ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'timeZone', label: 'Timezone' },
    { key: 'absent', label: 'Absent', format: 'boolean' },
  ],
};

export const availableSlotsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'slots',
      label: 'Available Slots by Date',
      value: '',
      dynamicKey: true,
      description: 'Each key is a date (YYYY-MM-DD); each value is an array of slot objects with a `start` ISO timestamp.',
    },
  ],
};

export const listSchedulesActionOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    { key: 'schedules', label: 'Schedules', value: '', listItems: scheduleFields },
  ],
};

export const scheduleActionOutputSchema: OutputSchema = {
  fields: scheduleFields,
};

export const listTimezonesActionOutputSchema: OutputSchema = {
  itemLabel: '{city}, {country}',
  fields: [
    {
      key: 'timezones',
      label: 'Timezones',
      value: '',
      listItems: [
        { key: 'city', label: 'City' },
        { key: 'timezone', label: 'Timezone' },
        { key: 'country', label: 'Country' },
        { key: 'region', label: 'Region' },
      ],
    },
  ],
};

export const profileActionOutputSchema: OutputSchema = {
  fields: profileFields,
};

const bookingEventFields: OutputSchema['fields'] = [
  { key: 'triggerEvent', label: 'Trigger Event' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  {
    key: 'payload',
    label: 'Booking',
    children: [
      { key: 'uid', label: 'Booking UID' },
      { key: 'title', label: 'Title' },
      { key: 'type', label: 'Event Type Slug' },
      { key: 'description', label: 'Description' },
      { key: 'startTime', label: 'Start Time', format: 'datetime' },
      { key: 'endTime', label: 'End Time', format: 'datetime' },
      { key: 'status', label: 'Status' },
      { key: 'location', label: 'Location' },
      { key: 'eventTypeId', label: 'Event Type ID', format: 'number' },
      { key: 'cancellationReason', label: 'Cancellation Reason' },
      { key: 'rescheduleUid', label: 'Reschedule UID' },
      { key: 'rescheduleStartTime', label: 'Rescheduled Start Time', format: 'datetime' },
      { key: 'rescheduleEndTime', label: 'Rescheduled End Time', format: 'datetime' },
      {
        key: 'organizer',
        label: 'Organizer',
        children: [
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email', format: 'email' },
          { key: 'timeZone', label: 'Timezone' },
        ],
      },
      {
        key: 'attendees',
        label: 'Attendees',
        labelKey: 'name',
        listItems: [
          { key: 'name', label: 'Name' },
          { key: 'email', label: 'Email', format: 'email' },
          { key: 'timeZone', label: 'Timezone' },
        ],
      },
    ],
  },
];

export const bookingEventTriggerOutputSchema: OutputSchema = {
  fields: bookingEventFields,
};
