import {
  createAction,
  DynamicPropsValue,
  Property,
} from '@activepieces/pieces-framework';
import { beeboleAuth } from '../common/auth';
import { beeboleClient } from '../common/client';
import { beeboleProps } from '../common/props';

type CreateTimeEntryResponse = {
  status: string;
  time_entry?: {
    id: number;
    date: string;
    hours: number;
    comment?: string;
  };
  message?: string;
};

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createMultipleTimeEntriesAction = createAction({
  auth: beeboleAuth,
  name: 'create_multiple_time_entries',
  displayName: 'Create Multiple Time Entries',
  description:
    'Creates time entries (working time or absence) across multiple days in Beebole.',
  props: {
    entryType: Property.StaticDropdown({
      displayName: 'Entry Type',
      description:
        'Choose whether you are logging working time on a subproject or an absence (e.g. vacation, sick leave).',
      required: true,
      defaultValue: 'working_time',
      options: {
        options: [
          { label: 'Working Time', value: 'working_time' },
          { label: 'Absence', value: 'absence' },
        ],
      },
    }),
    // target: Property.DynamicProperties({
    //   auth: beeboleAuth,
    //   displayName: 'Target',
    //   required: true,
    //   refreshers: ['entryType'],
    //   props: async ({ entryType }): Promise<DynamicPropsValue> => {
    //     if (entryType === 'absence') {
    //     return {
    absence: beeboleProps.absenceDropdown({
      required: false,
      description:
        'The absence type (e.g. Vacation, Sick Leave) to log on the selected dates.',
    }),
    //     };
    //}
    //return {
    company: beeboleProps.companyDropdown({
      required: false,
      description: 'The company that owns the project.',
    }),
    project: beeboleProps.projectDropdown({
      required: false,
      description: 'The project containing the subproject.',
    }),
    subproject: beeboleProps.subprojectDropdown({
      required: false,
      description: 'The subproject to log working time against.',
    }),
    //   };
    // },
    // }),
    dates: Property.Array({
      displayName: 'Dates',
      description:
        'The dates to create time entries for, each in YYYY-MM-DD format (e.g. "2026-05-21").',
      required: true,
    }),
    hours: Property.Number({
      displayName: 'Hours per Day',
      description:
        'The number of hours to log for each date (e.g. 8 for a full working day).',
      required: true,
      defaultValue: 8,
    }),
    comment: Property.LongText({
      displayName: 'Comment',
      description: 'Optional comment applied to every created time entry.',
      required: false,
    }),
    continueOnError: Property.Checkbox({
      displayName: 'Continue on Error',
      description:
        'If enabled, a failure on one date will not stop creation for the remaining dates.',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { entryType, dates, hours, comment, continueOnError } =
      context.propsValue;

    const dateList = (dates as unknown[])
      .map((d) => (typeof d === 'string' ? d.trim() : ''))
      .filter((d) => d.length > 0);

    if (dateList.length === 0) {
      throw new Error('At least one date is required.');
    }

    const invalidDates = dateList.filter((d) => !dateRegex.test(d));
    if (invalidDates.length > 0) {
      throw new Error(
        `Invalid date format (expected YYYY-MM-DD): ${invalidDates.join(', ')}`
      );
    }
    if (entryType === 'absence' && !context.propsValue.absence) {
      throw new Error('Absence type is required when Entry Type is Absence.');
    }
    if (entryType === 'working_time' && !context.propsValue.subproject) {
      throw new Error(
        'Subproject is required when Entry Type is Working Time.'
      );
    }
    const targetBody: Record<string, unknown> = {};
    if (entryType === 'absence') {
      targetBody['absence'] = { id: context.propsValue.absence };
    } else {
      targetBody['subproject'] = { id: context.propsValue.subproject };
    }

    const created: Array<Record<string, unknown>> = [];
    const failed: Array<Record<string, unknown>> = [];

    for (const date of dateList) {
      const body: Record<string, unknown> = {
        service: 'time_entry.create',
        ...targetBody,
        date,
        hours,
      };
      if (comment) {
        body['comment'] = comment;
      }

      try {
        const response = await beeboleClient.call<CreateTimeEntryResponse>({
          token: context.auth.secret_text,
          body,
        });

        if (response.body.status !== 'ok') {
          throw new Error(response.body.message ?? 'Unknown error');
        }

        const entry = response.body.time_entry;
        created.push({
          time_entry_id: entry?.id ?? null,
          date,
          hours: entry?.hours ?? hours,
          comment: entry?.comment ?? comment ?? null,
          status: 'ok',
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!continueOnError) {
          throw new Error(
            `Failed to create time entry for ${date}: ${message}`
          );
        }
        failed.push({ date, error: message });
      }
    }

    return {
      created_count: created.length,
      failed_count: failed.length,
      created,
      failed,
    };
  },
});
