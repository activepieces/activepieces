import {
  httpClient,
  HttpMethod,
  HttpMessageBody,
  HttpResponse,
  AuthenticationType,
} from '@activepieces/pieces-common';

export const BASE_URL = 'https://public-api.granola.ai/v1';

export async function granolaApiCall<T extends HttpMessageBody>({
  token,
  method,
  path,
  queryParams,
}: {
  token: string;
  method: HttpMethod;
  path: string;
  queryParams?: Record<string, string>;
}): Promise<HttpResponse<T>> {
  return await httpClient.sendRequest<T>({
    method,
    url: `${BASE_URL}${path}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token,
    },
    queryParams,
  });
}

interface GranolaNote {
  id: string;
  object: string;
  title: string;
  owner: { name: string | null; email: string };
  created_at: string;
  updated_at: string;
  calendar_event?: {
    event_title: string;
    organiser: string;
    calendar_event_id: string;
    scheduled_start_time: string;
    scheduled_end_time: string;
    invitees?: { name: string | null; email: string }[];
  };
  attendees?: { name: string | null; email: string }[];
  folder_membership?: { id: string; object: string; name: string }[];
  summary_text?: string;
  summary_markdown?: string | null;
  transcript?: {
    speaker: { source: string };
    text: string;
    start_time: string;
    end_time: string;
  }[];
}

interface GranolaListResponse {
  notes: GranolaNote[];
  hasMore: boolean;
  cursor?: string;
}

function flattenNote(note: GranolaNote) {
  return {
    id: note.id,
    title: note.title,
    owner_name: note.owner?.name ?? null,
    owner_email: note.owner?.email ?? null,
    created_at: note.created_at,
    updated_at: note.updated_at,
    calendar_event_title: note.calendar_event?.event_title ?? null,
    calendar_organiser: note.calendar_event?.organiser ?? null,
    calendar_event_id: note.calendar_event?.calendar_event_id ?? null,
    scheduled_start_time:
      note.calendar_event?.scheduled_start_time ?? null,
    scheduled_end_time: note.calendar_event?.scheduled_end_time ?? null,
    attendees: note.attendees
      ? note.attendees
        .map((a) => a.name ?? a.email)
        .join(', ')
      : null,
    folders: note.folder_membership
      ? note.folder_membership.map((f) => f.name).join(', ')
      : null,
    summary_text: note.summary_text ?? null,
    summary_markdown: note.summary_markdown ?? null,
  };
}

function flattenNoteWithTranscript(note: GranolaNote) {
  const flat = flattenNote(note);
  return {
    ...flat,
    transcript: note.transcript
      ? note.transcript
        .map((t) => `[${t.speaker.source}] ${t.text}`)
        .join('\n')
      : null,
  };
}

export { flattenNote, flattenNoteWithTranscript };
export type { GranolaNote, GranolaListResponse };
