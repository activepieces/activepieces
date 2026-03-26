import { httpClient, HttpMethod, AuthenticationType, HttpMessageBody, HttpResponse } from '@activepieces/pieces-common';

export const SAVVYCAL_BASE_URL = 'https://api.savvycal.com/v1';

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
  console.log("sdfsd",token)
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
  const results: T[] = [];
  let after: string | null = null;

  do {
    const params: Record<string, string> = {
      limit: '100',
      ...queryParams,
    };
    if (after) params['after'] = after;

    const response = await savvyCalApiCall<{ entries: T[]; metadata: { after: string | null } }>({
      token,
      method: HttpMethod.GET,
      path,
      queryParams: params,
    });

    results.push(...response.body.entries);
    after = response.body.metadata.after;
  } while (after);

  return results;
}

export function flattenEvent(event: SavvyCalEvent): Record<string, unknown> {
  const scheduler = event.attendees?.find((a) => !a.is_organizer) ?? event.attendees?.[0] ?? null;
  return {
    id: event.id,
    summary: event.summary ?? null,
    description: event.description ?? null,
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
    scheduling_link_slug: event.link?.slug ?? null,
    attendee_display_name: scheduler?.display_name ?? null,
    attendee_first_name: scheduler?.first_name ?? null,
    attendee_last_name: scheduler?.last_name ?? null,
    attendee_email: scheduler?.email ?? null,
    attendee_phone: scheduler?.phone_number ?? null,
    attendee_time_zone: scheduler?.time_zone ?? null,
    conferencing_type: event.conferencing?.type ?? null,
    conferencing_join_url: event.conferencing?.join_url ?? null,
    conferencing_meeting_id: event.conferencing?.meeting_id ?? null,
    payment_state: event.payment?.state ?? null,
    payment_amount_total_cents: event.payment?.amount_total ?? null,
  };
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
}

export interface SavvyCalEvent {
  id: string;
  summary: string | null;
  description: string | null;
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
  is_group_session: boolean;
  location: string | null;
  attendees: SavvyCalAttendee[];
  conferencing: {
    type: string | null;
    join_url: string | null;
    meeting_id: string | null;
  } | null;
  link: {
    id: string;
    name: string;
    slug: string;
  } | null;
  payment: {
    state: string;
    amount_total: number | null;
  } | null;
}

export interface SavvyCalSchedulingLink {
  id: string;
  name: string;
  slug: string;
  url: string;
  active: boolean;
  duration: number | null;
  created_at: string;
  updated_at: string;
}
