import { OutputSchema, Property } from '@activepieces/pieces-framework';
import { matomoApi } from '../api';
import { matomoAuth } from '../auth';

function siteIdDropdown() {
  return Property.Dropdown<string, false, typeof matomoAuth>({
    auth: matomoAuth,
    displayName: 'Site',
    description: 'The Matomo site to use. Leave empty to use the site ID from the connection.',
    required: false,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Please connect your account first' };
      }
      try {
        const sites = await matomoApi.call({
          auth: auth.props,
          method: 'SitesManager.getSitesWithAtLeastViewAccess',
          withoutSite: true,
        });
        return {
          disabled: false,
          options: matomoApi.toArray(sites).filter(matomoApi.isRecord).map((site) => ({
            label: `${String(site['name'] ?? '')} (ID ${String(site['idsite'] ?? '')})`,
            value: String(site['idsite'] ?? ''),
          })),
        };
      } catch {
        return { disabled: true, options: [], placeholder: 'Could not load sites. Check the connection.' };
      }
    },
  });
}

function periodDropdown({ required }: { required: boolean }) {
  return Property.StaticDropdown({
    displayName: 'Period',
    description: 'The reporting period. With "Date Range", put two dates separated by a comma in Date (2026-11-01,2026-11-18).',
    required,
    defaultValue: 'day',
    options: {
      disabled: false,
      options: PERIOD_OPTIONS,
    },
  });
}

function dateText({ required }: { required: boolean }) {
  return Property.ShortText({
    displayName: 'Date',
    description: 'today, yesterday, or a date as YYYY-MM-DD. For the Date Range period use YYYY-MM-DD,YYYY-MM-DD; lastN/previousN (e.g. last7) also work with Date Range.',
    required,
    defaultValue: 'today',
    placeholder: 'today or 2026-01-31',
  });
}

function resolvePeriod({ period, date }: { period: string | undefined; date: string | undefined }): { period: string; date: string } {
  const cleanDate = (date ?? '').trim() || 'today';
  const cleanPeriod = (period ?? '').trim() || 'day';
  if (!PERIOD_VALUES.includes(cleanPeriod)) {
    throw new Error(`Period must be one of ${PERIOD_VALUES.join(', ')}.`);
  }
  if (cleanPeriod !== 'range' && !SINGLE_DATE.test(cleanDate)) {
    throw new Error('Date must be today, yesterday or YYYY-MM-DD. To cover several days, choose the Date Range period.');
  }
  if (cleanPeriod === 'range' && !RANGE_DATE.test(cleanDate)) {
    throw new Error('For the Date Range period, Date must be YYYY-MM-DD,YYYY-MM-DD, lastN or previousN.');
  }
  return { period: cleanPeriod, date: cleanDate };
}

function toAnnotationDate(value: string): string {
  const trimmed = value.trim();
  const direct = /^(\d{4}-\d{2}-\d{2})(?:$|[T ])/.exec(trimmed);
  if (direct) {
    return direct[1];
  }
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error('Date must be a valid date in YYYY-MM-DD format.');
  }
  return parsed.toISOString().slice(0, 10);
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value.replace('%', ''));
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

const PERIOD_OPTIONS = [
  { label: 'Day', value: 'day' },
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: 'Year', value: 'year' },
  { label: 'Date Range', value: 'range' },
];
const PERIOD_VALUES = PERIOD_OPTIONS.map((option) => option.value);
const SINGLE_DATE = /^(today|yesterday|\d{4}-\d{2}-\d{2})$/;
const RANGE_DATE = /^((last|previous)\d+|\d{4}-\d{2}-\d{2},(\d{4}-\d{2}-\d{2}|today|yesterday))$/;

function goalDropdown() {
  return Property.Dropdown<number, false, typeof matomoAuth>({
    auth: matomoAuth,
    displayName: 'Goal',
    description: 'The goal to report on. Leave empty for all goals combined.',
    required: false,
    refreshers: ['siteId'],
    options: async ({ auth, siteId }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Please connect your account first' };
      }
      try {
        const goals = await matomoApi.call({ auth: auth.props, method: 'Goals.getGoals', idSite: optionalString(siteId) });
        const options = matomoApi
          .toArray(goals)
          .filter(matomoApi.isRecord)
          .flatMap((goal) => {
            const id = toNumber(goal['idgoal']);
            return id === null ? [] : [{ label: String(goal['name'] ?? `Goal ${id}`), value: id }];
          });
        return { disabled: false, options, placeholder: options.length === 0 ? 'No goals on this site' : 'Leave empty for all goals' };
      } catch {
        return { disabled: true, options: [], placeholder: 'Could not load goals. Check the connection.' };
      }
    },
  });
}

function annotationDropdown() {
  return Property.Dropdown<number, true, typeof matomoAuth>({
    auth: matomoAuth,
    displayName: 'Annotation',
    description: 'The annotation to delete. Annotations from the last year are listed.',
    required: true,
    refreshers: ['siteId'],
    options: async ({ auth, siteId }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Please connect your account first' };
      }
      try {
        const response = await matomoApi.call({
          auth: auth.props,
          method: 'Annotations.getAll',
          idSite: optionalString(siteId),
          params: { period: 'range', date: 'last365' },
        });
        const options = flattenAnnotations({ value: response, depth: 0 })
          .map(toAnnotation)
          .flatMap((note) => (note.idNote === null ? [] : [{ label: `${String(note.date ?? '')} — ${String(note.note ?? '')}`, value: note.idNote }]));
        return { disabled: false, options, placeholder: options.length === 0 ? 'No annotations in the last year' : 'Select an annotation' };
      } catch {
        return { disabled: true, options: [], placeholder: 'Could not load annotations. Check the connection.' };
      }
    },
  });
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' || typeof value === 'number' ? String(value) : undefined;
}

function flattenAnnotations({ value, depth }: { value: unknown; depth: number }): Record<string, unknown>[] {
  if (depth > MAX_ANNOTATION_DEPTH) {
    return [];
  }
  if (matomoApi.isRecord(value) && 'idNote' in value) {
    return [value];
  }
  return matomoApi.toArray(value).flatMap((item) => flattenAnnotations({ value: item, depth: depth + 1 }));
}

function toAnnotation(raw: unknown) {
  const note = matomoApi.isRecord(raw) ? raw : {};
  return {
    idNote: toNumber(note['idNote']),
    idsite: toNumber(note['idsite']),
    date: note['date'] ?? null,
    note: note['note'] ?? null,
    starred: note['starred'] === true || toNumber(note['starred']) === 1,
    user: note['user'] ?? null,
    canEditOrDelete: note['canEditOrDelete'] ?? null,
  };
}

function unixToIso(value: unknown): string | null {
  const seconds = toNumber(value);
  return seconds === null ? null : new Date(seconds * 1000).toISOString();
}

function toVisit(visit: Record<string, unknown>) {
  const actionDetails = Array.isArray(visit['actionDetails'])
    ? visit['actionDetails'].map((detail) => (matomoApi.isRecord(detail) ? { ...detail, time: unixToIso(detail['timestamp']) } : detail))
    : visit['actionDetails'];
  return {
    ...visit,
    first_action_time: unixToIso(visit['firstActionTimestamp']),
    last_action_time: unixToIso(visit['lastActionTimestamp']),
    actionDetails,
  };
}

const MAX_ANNOTATION_DEPTH = 4;

const annotationOutputSchema: OutputSchema = {
  fields: [
    { key: 'idNote', label: 'Annotation ID' },
    { key: 'idsite', label: 'Site ID' },
    { key: 'date', label: 'Date (YYYY-MM-DD)' },
    { key: 'note', label: 'Note' },
    { key: 'starred', label: 'Starred', format: 'boolean' },
    { key: 'user', label: 'Created By' },
    { key: 'canEditOrDelete', label: 'Can Edit or Delete', format: 'boolean' },
  ],
};

const visitFields: OutputSchema['fields'] = [
  { key: 'idVisit', label: 'Visit ID' },
  { key: 'visitorId', label: 'Visitor ID' },
  { key: 'userId', label: 'User ID' },
  { key: 'first_action_time', label: 'First Action Time', format: 'datetime' },
  { key: 'last_action_time', label: 'Last Action Time', format: 'datetime' },
  { key: 'serverDate', label: 'Date (YYYY-MM-DD)' },
  { key: 'serverTimestamp', label: 'Server Timestamp (Unix seconds)' },
  { key: 'firstActionTimestamp', label: 'First Action (Unix seconds)' },
  { key: 'lastActionTimestamp', label: 'Last Action (Unix seconds)' },
  { key: 'visitDuration', label: 'Visit Duration (s)', format: 'number' },
  { key: 'actions', label: 'Actions', format: 'number' },
  { key: 'visitCount', label: 'Visit Count', format: 'number' },
  { key: 'visitorType', label: 'Visitor Type' },
  { key: 'referrerType', label: 'Referrer Type' },
  { key: 'referrerName', label: 'Referrer Name' },
  { key: 'referrerUrl', label: 'Referrer URL', format: 'url' },
  { key: 'country', label: 'Country' },
  { key: 'city', label: 'City' },
  { key: 'deviceType', label: 'Device Type' },
  { key: 'browserName', label: 'Browser' },
  { key: 'operatingSystemName', label: 'Operating System' },
  {
    key: 'actionDetails',
    label: 'Action Details',
    listItems: [
      { key: 'type', label: 'Type' },
      { key: 'url', label: 'URL', format: 'url' },
      { key: 'pageTitle', label: 'Page Title' },
      { key: 'eventCategory', label: 'Event Category' },
      { key: 'eventAction', label: 'Event Action' },
      { key: 'time', label: 'Time', format: 'datetime' },
      { key: 'timestamp', label: 'Timestamp (Unix seconds)' },
    ],
  },
];

export const matomoProps = { siteIdDropdown, periodDropdown, dateText, goalDropdown, annotationDropdown };
export const matomoUtils = { resolvePeriod, toAnnotationDate, toNumber, annotationOutputSchema, visitFields, flattenAnnotations, toAnnotation, toVisit };
