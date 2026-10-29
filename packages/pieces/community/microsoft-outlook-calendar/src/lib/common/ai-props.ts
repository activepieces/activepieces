import { Property } from '@activepieces/pieces-framework';

import { outlookCalendarUtils } from './utils';

import type { PropParams } from './props';

function calendarId<R extends boolean>({
  required,
  displayName = 'Calendar ID',
  description = 'Calendar ID, from List Calendars or List Calendars in Group.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function calendarGroupId<R extends boolean>({
  required,
  displayName = 'Calendar Group ID',
  description = 'Calendar group ID, from List Calendar Groups.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function eventId<R extends boolean>({
  required,
  displayName = 'Event ID',
  description = 'Event ID, from List Events, Get Calendar View or Create Event.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function limit<R extends boolean>({
  required,
  displayName = 'Limit',
  description = 'Maximum number of items to return in this page (1-1000). Defaults to 50.',
}: PropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function pageUrl<R extends boolean>({
  required,
  displayName = 'Page URL',
  description = 'The @odata.nextLink from a previous call of this action, to fetch the next page. When set, the other filters are ignored because the link already carries them.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function timeZone<R extends boolean>({
  required,
  displayName = 'Output Time Zone',
  description = 'Time zone for the start and end times in the response, e.g. "Pacific Standard Time" or "Europe/London" (see Get Supported Time Zones). Defaults to UTC.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function attachmentId<R extends boolean>({
  required,
  displayName = 'Attachment ID',
  description = 'Attachment ID, from List Event Attachments or Add Event Attachment.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function extensionId<R extends boolean>({
  required,
  displayName = 'Extension Name or ID',
  description = 'The extensionName (e.g. "Com.Contoso.Referral") or the extension ID, from Create Event Extension.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function permissionId<R extends boolean>({
  required,
  displayName = 'Permission ID',
  description = 'Calendar permission ID, from List Calendar Permissions.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function calendarColor<R extends boolean>({
  required,
  displayName = 'Color',
  description = 'Color theme that distinguishes the calendar in Outlook.',
}: PropParams<R>) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    options: { disabled: false, options: CALENDAR_COLORS },
  });
}

function calendarRole<R extends boolean>({
  required,
  displayName = 'Role',
  description = `Permission level. One of: ${outlookCalendarUtils.calendarRoles().join(', ')}.`,
}: PropParams<R>) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    options: {
      disabled: false,
      options: outlookCalendarUtils.calendarRoles().map((value) => ({
        label: value,
        value,
      })),
    },
  });
}

function sendResponse<R extends boolean>({
  required,
  displayName = 'Send Response',
  description = 'Whether to send the response to the organizer. Defaults to true. Must stay true when proposing a new time.',
}: PropParams<R>) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    options: {
      disabled: false,
      options: [
        { label: 'Yes', value: 'true' },
        { label: 'No', value: 'false' },
      ],
    },
  });
}

function proposedStart<R extends boolean>({
  required,
  displayName = 'Proposed New Start',
  description = 'Start of the alternative time to propose, ISO 8601 without offset, e.g. "2026-11-03T15:00:00". Requires Proposed New End.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function proposedEnd<R extends boolean>({
  required,
  displayName = 'Proposed New End',
  description = 'End of the alternative time to propose, ISO 8601 without offset, e.g. "2026-11-03T16:00:00". Requires Proposed New Start.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function proposedTimeZone<R extends boolean>({
  required,
  displayName = 'Proposed Time Zone',
  description = 'Time zone of the proposed start and end, IANA or Windows name (see Get Supported Time Zones). Defaults to UTC.',
}: PropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

export const outlookCalendarAiProps = {
  calendarId,
  calendarGroupId,
  eventId,
  limit,
  pageUrl,
  timeZone,
  attachmentId,
  extensionId,
  permissionId,
  calendarColor,
  calendarRole,
  sendResponse,
  proposedStart,
  proposedEnd,
  proposedTimeZone,
};

const CALENDAR_COLORS = [
  { label: 'Auto', value: 'auto' },
  { label: 'Light Blue', value: 'lightBlue' },
  { label: 'Light Green', value: 'lightGreen' },
  { label: 'Light Orange', value: 'lightOrange' },
  { label: 'Light Gray', value: 'lightGray' },
  { label: 'Light Yellow', value: 'lightYellow' },
  { label: 'Light Teal', value: 'lightTeal' },
  { label: 'Light Pink', value: 'lightPink' },
  { label: 'Light Brown', value: 'lightBrown' },
  { label: 'Light Red', value: 'lightRed' },
  { label: 'Max Color', value: 'maxColor' },
];
