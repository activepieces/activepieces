import * as crypto from 'crypto';
import { httpClient, HttpMethod, AuthenticationType, HttpMessageBody, HttpResponse } from '@activepieces/pieces-common';
import { DropdownOption } from '@activepieces/pieces-framework';

export const SAVVYCAL_BASE_URL = 'https://api.savvycal.com/v1';

export function verifyWebhookSignature(secret: string, signatureHeader: string, rawBody: unknown): boolean {
  const bodyString = typeof rawBody === 'string' ? rawBody : Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : JSON.stringify(rawBody);
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(bodyString).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader.toLowerCase()));
  } catch {
    return false;
  }
}

export async function savvyCalApiCall<T extends HttpMessageBody>({
  token,
  method,
  path,
  body,
  queryParams,
}: {
  token: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: Record<string, string>;
}): Promise<HttpResponse<T>> {
  return httpClient.sendRequest<T>({
    method,
    url: `${SAVVYCAL_BASE_URL}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
    queryParams,
    body,
  });
}

export async function savvyCalPaginatedCall<T>({
  token,
  path,
  queryParams,
}: {
  token: string;
  path: string;
  queryParams?: Record<string, string>;
}): Promise<T[]> {
  return savvyCalCollect<T>({ token, path, queryParams });
}

export async function savvyCalCollect<T>({
  token,
  path,
  queryParams,
  keep,
  limit,
}: {
  token: string;
  path: string;
  queryParams?: Record<string, string>;
  keep?: (entry: T) => boolean;
  limit?: number;
}): Promise<T[]> {
  const pageSize = limit && !keep ? Math.min(limit, MAX_PAGE_SIZE) : MAX_PAGE_SIZE;
  let collected: T[] = [];
  let after: string | null = null;

  do {
    const params: Record<string, string> = { ...queryParams, limit: String(pageSize) };
    if (after) params['after'] = after;

    const response = await savvyCalApiCall<{ entries: T[]; metadata: { after: string | null } }>({
      token,
      method: HttpMethod.GET,
      path,
      queryParams: params,
    });

    const matching = keep ? response.body.entries.filter(keep) : response.body.entries;
    collected = [...collected, ...matching];
    after = limit && collected.length >= limit ? null : response.body.metadata.after;
  } while (after);

  return limit ? collected.slice(0, limit) : collected;
}

export function buildEventQuery({
  period,
  startAfter,
  startBefore,
  states,
  linkIds,
  search,
  includeEventsNotAttending,
  newestFirst,
}: {
  period?: string;
  startAfter?: string;
  startBefore?: string;
  states?: string[];
  linkIds?: string[];
  search?: string;
  includeEventsNotAttending?: boolean;
  newestFirst?: boolean;
}): EventQuery {
  const selectedStates = states ?? [];
  const selectedLinkIds = linkIds ?? [];
  const hasDateRange = Boolean(startAfter || startBefore);

  const queryParams: Record<string, string> = {
    state: selectedStates.length === 1 ? selectedStates[0] : 'any',
    period: hasDateRange ? 'fixed' : period || 'upcoming',
  };
  if (hasDateRange) {
    queryParams['from'] = startAfter ? shiftIsoDate({ isoDateTime: startAfter, days: -1 }) : EARLIEST_DATE;
    queryParams['until'] = startBefore ? shiftIsoDate({ isoDateTime: startBefore, days: 1 }) : LATEST_DATE;
  }
  if (selectedLinkIds.length === 1) queryParams['link'] = selectedLinkIds[0];
  if (search && search.trim() !== '') queryParams['q'] = search.trim();
  if (includeEventsNotAttending) queryParams['attendance'] = 'any';
  if (newestFirst) queryParams['direction'] = 'desc';

  const filters: Array<(event: SavvyCalEvent) => boolean> = [
    ...(selectedStates.length > 1 ? [(event: SavvyCalEvent) => selectedStates.includes(event.state)] : []),
    ...(selectedLinkIds.length > 1 ? [(event: SavvyCalEvent) => selectedLinkIds.includes(event.link?.id ?? '')] : []),
    ...(startAfter ? [(event: SavvyCalEvent) => Date.parse(event.start_at) >= Date.parse(startAfter)] : []),
    ...(startBefore ? [(event: SavvyCalEvent) => Date.parse(event.start_at) <= Date.parse(startBefore)] : []),
  ];

  return {
    queryParams,
    keep: filters.length > 0 ? (event) => filters.every((matches) => matches(event)) : undefined,
  };
}

export async function buildTeamOptions(token: string): Promise<DropdownOption<string>[]> {
  const scopes = await fetchLinkScopes(token);
  return [{ label: 'Personal', value: 'personal' }, ...scopes.map((scope) => ({ label: scope.name, value: scope.id }))];
}

export async function buildTeamSlugOptions(token: string): Promise<DropdownOption<string>[]> {
  const scopes = await fetchLinkScopes(token);
  return [{ label: 'Personal', value: 'personal' }, ...scopes.map((scope) => ({ label: scope.name, value: scope.slug }))];
}

export async function buildWorkflowOptions(token: string): Promise<DropdownOption<string>[]> {
  const workflows = await savvyCalPaginatedCall<{ id: string; name: string }>({ token, path: '/workflows' });
  return workflows.map((w) => ({ label: w.name, value: w.id }));
}

export async function buildLinkOptions(token: string, selectedTeam?: unknown): Promise<DropdownOption<string>[]> {
  const links = await savvyCalPaginatedCall<SavvyCalSchedulingLink>({ token, path: '/links' });
  const teamId = typeof selectedTeam === 'string' ? selectedTeam : null;
  const filtered = teamId
    ? teamId === 'personal'
      ? links.filter((l) => l.scope === null)
      : links.filter((l) => l.scope?.id === teamId)
    : links;
  return filtered.map((l) => ({ label: `${l.name} (${l.slug})`, value: l.id }));
}

export function flattenLink(link: SavvyCalSchedulingLink): Record<string, unknown> {
  return {
    id: link.id,
    name: link.name,
    private_name: link.private_name ?? null,
    slug: link.slug,
    state: link.state ?? null,
    active: link.state === 'active',
    description: link.description || null,
    duration_minutes: link.default_duration ?? null,
    available_durations_minutes: link.durations ?? [],
    slot_increment_minutes: link.increment ?? null,
    team_id: link.scope?.id ?? null,
    team_name: link.scope?.name ?? null,
    team_slug: link.scope?.slug ?? null,
  };
}

export function flattenEvent(event: SavvyCalEvent): Record<string, unknown> {
  const attendees = event.attendees ?? [];
  const organizer = event.organizer ?? attendees.find((a) => a.is_organizer) ?? null;
  const scheduler = event.scheduler ?? attendees.find((a) => !a.is_organizer) ?? null;
  return {
    id: event.id,
    uuid: event.uuid ?? null,
    summary: event.summary ?? null,
    description: event.description || null,
    additional_info: event.additional_info ?? null,
    state: event.state,
    start_at: event.start_at,
    end_at: event.end_at,
    duration_minutes: event.duration ?? null,
    url: event.url ?? null,
    location: event.location ?? null,
    is_group_session: event.is_group_session ?? null,
    created_at: event.created_at,
    canceled_at: event.canceled_at ?? null,
    cancel_reason: event.cancel_reason ?? null,
    rescheduled_at: event.rescheduled_at ?? null,
    reschedule_reason: event.reschedule_reason ?? null,
    original_start_at: event.original_start_at ?? null,
    original_end_at: event.original_end_at ?? null,
    scheduling_link_id: event.link?.id ?? null,
    scheduling_link_name: event.link?.name ?? null,
    scheduling_link_private_name: event.link?.private_name ?? null,
    scheduling_link_slug: event.link?.slug ?? null,
    team_id: event.scope?.id ?? null,
    team_name: event.scope?.name ?? null,
    team_slug: event.scope?.slug ?? null,
    poll_id: event.poll?.id ?? null,
    poll_name: event.poll?.name ?? null,
    ...flattenEventAttendee(scheduler),
    organizer_display_name: organizer?.display_name ?? null,
    organizer_first_name: organizer?.first_name ?? null,
    organizer_last_name: organizer?.last_name ?? null,
    organizer_email: organizer?.email ?? null,
    attendee_count: attendees.filter((a) => !a.is_organizer).length,
    attendees: attendees.map(toAttendeeRow),
    conferencing_type: event.conferencing?.type ?? null,
    conferencing_join_url: event.conferencing?.join_url ?? null,
    conferencing_meeting_id: event.conferencing?.meeting_id ?? null,
    conferencing_instructions: event.conferencing?.instructions ?? null,
    payment_state: event.payment?.state ?? null,
    payment_amount_total_cents: event.payment?.amount_total ?? null,
    payment_url: event.payment?.url ?? null,
    metadata: event.metadata ?? {},
  };
}

export function flattenEventAttendee(attendee: SavvyCalAttendee | null): Record<string, unknown> {
  return {
    attendee_display_name: attendee?.display_name ?? null,
    attendee_first_name: attendee?.first_name ?? null,
    attendee_last_name: attendee?.last_name ?? null,
    attendee_email: attendee?.email ?? null,
    attendee_phone: attendee?.phone_number ?? null,
    attendee_time_zone: attendee?.time_zone ?? null,
    attendee_response_status: attendee?.response_status ?? null,
    attendee_marketing_opt_in: attendee?.marketing_opt_in ?? null,
    attendee_answers: Object.fromEntries((attendee?.fields ?? []).map((field) => [field.label, field.value ?? null])),
  };
}

export function readWebhookBody(body: unknown): { type: string; payload: unknown } | null {
  if (!isRecord(body) || typeof body['type'] !== 'string') return null;
  return { type: body['type'], payload: body['payload'] };
}

export function unwrapEventWebhook({ type, payload }: { type: string; payload: unknown }): UnwrappedEventWebhook | null {
  if (!isRecord(payload)) return null;

  if (type === 'event.changed') {
    const event = payload['event'];
    if (!isSavvyCalEvent(event)) return null;
    const previous = isRecord(payload['previous_attributes']) ? payload['previous_attributes'] : {};
    return {
      event,
      attendee: null,
      previous: {
        event_id: null,
        start_at: readString(previous['start_at']),
        end_at: readString(previous['end_at']),
        state: readString(previous['state']),
      },
    };
  }

  if (type === 'event.attendee.added' || type === 'event.attendee.canceled') {
    const event = payload['event'];
    if (!isSavvyCalEvent(event)) return null;
    const attendee = payload['attendee'];
    return { event, attendee: isSavvyCalAttendee(attendee) ? attendee : null, previous: null };
  }

  if (type === 'event.attendee.rescheduled') {
    const event = payload['new_event'];
    if (!isSavvyCalEvent(event)) return null;
    const attendee = payload['new_attendee'];
    const original = payload['original_event'];
    return {
      event,
      attendee: isSavvyCalAttendee(attendee) ? attendee : null,
      previous: isSavvyCalEvent(original)
        ? { event_id: original.id, start_at: original.start_at, end_at: original.end_at, state: original.state }
        : null,
    };
  }

  return isSavvyCalEvent(payload) ? { event: payload, attendee: null, previous: null } : null;
}

export function flattenEventWebhook({ type, unwrapped }: { type: string; unwrapped: UnwrappedEventWebhook }): Record<string, unknown> {
  return {
    event_type: type,
    ...flattenEvent(unwrapped.event),
    ...(unwrapped.attendee ? flattenEventAttendee(unwrapped.attendee) : {}),
    previous_event_id: unwrapped.previous?.event_id ?? null,
    previous_start_at: unwrapped.previous?.start_at ?? null,
    previous_end_at: unwrapped.previous?.end_at ?? null,
    previous_state: unwrapped.previous?.state ?? null,
  };
}

export function buildAttendeeNames({
  fullName,
  firstName,
  lastName,
}: {
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}): AttendeeNames | null {
  const trimmedFullName = fullName?.trim() ?? '';
  const [firstWord = '', ...otherWords] = trimmedFullName.split(/\s+/).filter((word) => word.length > 0);
  const first = firstName?.trim() || firstWord;
  const last = lastName?.trim() || otherWords.join(' ');
  const displayName = trimmedFullName || [first, last].filter((part) => part.length > 0).join(' ');
  if (displayName.length === 0) return null;
  return {
    display_name: displayName,
    ...(first ? { first_name: first } : {}),
    ...(last ? { last_name: last } : {}),
  };
}

async function fetchLinkScopes(token: string): Promise<SavvyCalScope[]> {
  const links = await savvyCalPaginatedCall<SavvyCalSchedulingLink>({ token, path: '/links' });
  return links
    .map((link) => link.scope)
    .filter((scope): scope is SavvyCalScope => scope !== null && scope !== undefined)
    .filter((scope, index, all) => all.findIndex((other) => other.id === scope.id) === index);
}

function toAttendeeRow(attendee: SavvyCalAttendee): Record<string, unknown> {
  return {
    display_name: attendee.display_name ?? null,
    first_name: attendee.first_name ?? null,
    last_name: attendee.last_name ?? null,
    email: attendee.email,
    phone: attendee.phone_number ?? null,
    time_zone: attendee.time_zone ?? null,
    response_status: attendee.response_status ?? null,
    is_organizer: attendee.is_organizer,
  };
}

function shiftIsoDate({ isoDateTime, days }: { isoDateTime: string; days: number }): string {
  const date = new Date(isoDateTime);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isSavvyCalEvent(value: unknown): value is SavvyCalEvent {
  return isRecord(value) && typeof value['id'] === 'string' && typeof value['start_at'] === 'string';
}

function isSavvyCalAttendee(value: unknown): value is SavvyCalAttendee {
  return isRecord(value) && typeof value['email'] === 'string';
}

function readString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

const MAX_PAGE_SIZE = 100;
const EARLIEST_DATE = '2000-01-01';
const LATEST_DATE = '2100-12-31';

export const LINK_USAGE_OPTIONS = [
  { label: 'Multi-use', value: 'recurring' },
  { label: 'Single-use', value: 'single' },
];

export type AttendeeNames = {
  display_name: string;
  first_name?: string;
  last_name?: string;
};

export type EventQuery = {
  queryParams: Record<string, string>;
  keep: ((event: SavvyCalEvent) => boolean) | undefined;
};

export type UnwrappedEventWebhook = {
  event: SavvyCalEvent;
  attendee: SavvyCalAttendee | null;
  previous: {
    event_id: string | null;
    start_at: string | null;
    end_at: string | null;
    state: string | null;
  } | null;
};

export interface SavvyCalEventField {
  id: string;
  label: string;
  type: string;
  value: string | null;
}

export interface SavvyCalAttendee {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  email: string;
  phone_number: string | null;
  time_zone: string | null;
  is_organizer: boolean;
  response_status: string | null;
  marketing_opt_in?: boolean;
  fields?: SavvyCalEventField[];
}

export interface SavvyCalEvent {
  id: string;
  uuid: string | null;
  summary: string | null;
  description: string | null;
  additional_info?: string | null;
  duration: number;
  start_at: string;
  end_at: string;
  state: string;
  url: string | null;
  created_at: string;
  canceled_at: string | null;
  cancel_reason: string | null;
  rescheduled_at: string | null;
  reschedule_reason: string | null;
  original_start_at: string | null;
  original_end_at: string | null;
  is_group_session: boolean | null;
  location: string | null;
  organizer?: SavvyCalAttendee | null;
  scheduler?: SavvyCalAttendee | null;
  attendees: SavvyCalAttendee[];
  conferencing: {
    type: string | null;
    join_url: string | null;
    meeting_id: string | null;
    instructions?: string | null;
  } | null;
  link: {
    id: string;
    name: string;
    slug: string;
    private_name?: string | null;
  } | null;
  scope?: SavvyCalScope | null;
  poll?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  payment: {
    state: string;
    amount_total: number | null;
    url?: string | null;
  } | null;
  metadata?: Record<string, unknown>;
}

export interface SavvyCalScope {
  id: string;
  name: string;
  slug: string;
}

export interface SavvyCalLinkFieldOption {
  id?: string;
  label?: string;
  name?: string;
  value?: string;
}

export interface SavvyCalLinkField {
  id: string;
  label: string;
  type: string;
  is_required?: boolean;
  options?: SavvyCalLinkFieldOption[] | string[];
  choices?: SavvyCalLinkFieldOption[] | string[];
}

export interface SavvyCalSchedulingLink {
  id: string;
  name: string;
  private_name?: string | null;
  slug: string;
  state?: string;
  description?: string;
  durations?: number[];
  default_duration?: number;
  increment?: number;
  scope: SavvyCalScope | null;
  fields?: SavvyCalLinkField[];
}
