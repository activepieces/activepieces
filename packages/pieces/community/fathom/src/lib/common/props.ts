import { Property } from '@activepieces/pieces-framework';
import { fathomAuth } from './auth';
import { FathomApiError, fathomClient } from './client';

function recordingDropdown({ description }: { description: string }) {
  return Property.Dropdown({
    auth: fathomAuth,
    displayName: 'Meeting Recording',
    description,
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return { disabled: true, options: [], placeholder: 'Please connect your Fathom account first' };
      }
      try {
        const result = await fathomClient.listPages({ auth, path: 'meetings', maxPages: DROPDOWN_MAX_PAGES });
        const options = result.items.flatMap((meeting) => {
          const recordingId = meeting['recording_id'];
          return typeof recordingId === 'number' ? [{ label: meetingLabel(meeting), value: recordingId }] : [];
        });
        if (options.length === 0) {
          return { disabled: false, options: [], placeholder: 'No recorded meetings found in this Fathom account' };
        }
        return {
          disabled: false,
          options,
          placeholder: result.truncated
            ? `Showing the ${DROPDOWN_MAX_PAGES} most recent pages of meetings; for older ones use the recording ID from List Meetings`
            : undefined,
        };
      } catch (error) {
        return { disabled: true, options: [], placeholder: dropdownError(error) };
      }
    },
  });
}

function meetingLabel(meeting: Record<string, unknown>): string {
  const title = typeof meeting['title'] === 'string' && meeting['title'].length > 0 ? meeting['title'] : 'Untitled meeting';
  const when = [meeting['scheduled_start_time'], meeting['created_at']].find((v): v is string => typeof v === 'string');
  return when === undefined ? title : `${title} · ${when.slice(0, 10)}`;
}

function dropdownError(error: unknown): string {
  if (error instanceof FathomApiError) {
    if (error.status === 401) {
      return 'Fathom did not accept the connection (401). Reconnect your Fathom account.';
    }
    if (error.status === 429) {
      return 'Fathom rate limit reached (429). Wait a minute and reopen this list.';
    }
    return `Failed to load meetings (HTTP ${error.status}).`;
  }
  return 'Failed to load meetings. Please check your connection.';
}

function recordingIdText({ description }: { description: string }) {
  return Property.ShortText({
    displayName: 'Recording ID',
    description,
    required: true,
  });
}

function parseRecordingId({ value }: { value: unknown }): number {
  const text = typeof value === 'number' ? String(value) : typeof value === 'string' ? value.trim() : '';
  if (!/^\d{1,15}$/.test(text)) {
    throw new Error('Recording ID must be the numeric recording_id from New Recording or List Meetings (for example 123456789).');
  }
  return Number(text);
}

function stringList({ value }: { value: unknown }): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const items = value
    .map((item) => (typeof item === 'string' ? item.trim() : typeof item === 'number' ? String(item) : ''))
    .filter((item) => item.length > 0);
  return items.length > 0 ? items : undefined;
}

function optionalText({ value }: { value: unknown }): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const text = value.trim();
  return text.length > 0 ? text : undefined;
}

function optionalTimestamp({ value, label }: { value: unknown; label: string }): string | undefined {
  const text = optionalText({ value });
  if (text === undefined) {
    return undefined;
  }
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${label} must be an ISO 8601 date-time such as 2026-01-31T00:00:00Z.`);
  }
  return parsed.toISOString().replace('.000Z', 'Z');
}

const DROPDOWN_MAX_PAGES = 10;

export const fathomProps = {
  recordingDropdown,
  recordingIdText,
};

export const fathomInputs = {
  parseRecordingId,
  stringList,
  optionalText,
  optionalTimestamp,
  meetingLabel,
  DROPDOWN_MAX_PAGES,
};
