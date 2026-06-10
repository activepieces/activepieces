import { createAction, Property } from '@activepieces/pieces-framework';
import { beeboleAuth } from '../common/auth';
import { beeboleClient } from '../common/client';

type DeleteTimeEntryResponse = {
  status: string;
  message?: string;
};

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const deleteMultipleTimeEntriesAction = createAction({
  auth: beeboleAuth,
  name: 'delete_multiple_time_entries',
  displayName: 'Delete Multiple Time Entries',
  description: 'Deletes multiple time entries (working time or absence) by their IDs and dates.',
  props: {
    entries: Property.Array({
      displayName: 'Time Entries to Delete',
      description: 'List of time entries to delete. Each row requires the time entry ID and the date it was logged on (YYYY-MM-DD).',
      required: true,
      properties: {
        id: Property.Number({
          displayName: 'Time Entry ID',
          description: 'The numeric ID of the time entry to delete. You can get this from a "List Time Entries" step or the Beebole API response when the entry was created.',
          required: true,
        }),
        date: Property.ShortText({
          displayName: 'Date',
          description: 'The date the entry was logged, in YYYY-MM-DD format (e.g. "2026-05-21").',
          required: true,
        }),
      },
    }),
    continueOnError: Property.Checkbox({
      displayName: 'Continue on Error',
      description: 'If enabled, a failure on one entry will not stop deletion for the remaining entries.',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { entries, continueOnError } = context.propsValue;

    const rows = entries as Array<{ id?: number | string; date?: string }>;

    if (!rows || rows.length === 0) {
      throw new Error('At least one time entry is required.');
    }

    const deleted: Array<Record<string, unknown>> = [];
    const failed: Array<Record<string, unknown>> = [];

    for (const row of rows) {
      const id = typeof row.id === 'string' ? Number(row.id) : row.id;
      const date = typeof row.date === 'string' ? row.date.trim() : '';

      if (!id || Number.isNaN(id)) {
        const message = 'Missing or invalid time entry ID.';
        if (!continueOnError) {
          throw new Error(message);
        }
        failed.push({ time_entry_id: row.id ?? null, date: date || null, error: message });
        continue;
      }

      if (!dateRegex.test(date)) {
        const message = `Invalid date format (expected YYYY-MM-DD): "${date}"`;
        if (!continueOnError) {
          throw new Error(message);
        }
        failed.push({ time_entry_id: id, date: date || null, error: message });
        continue;
      }

      try {
        const response = await beeboleClient.call<DeleteTimeEntryResponse>({
          token: context.auth.secret_text,
          body: {
            service: 'time_entry.delete',
            id,
            date,
          },
        });

        if (response.body.status !== 'ok') {
          throw new Error(response.body.message ?? 'Unknown error');
        }

        deleted.push({ time_entry_id: id, date, status: 'ok' });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!continueOnError) {
          throw new Error(`Failed to delete time entry ${id} on ${date}: ${message}`);
        }
        failed.push({ time_entry_id: id, date, error: message });
      }
    }

    return {
      deleted_count: deleted.length,
      failed_count: failed.length,
      deleted,
      failed,
    };
  },
});
