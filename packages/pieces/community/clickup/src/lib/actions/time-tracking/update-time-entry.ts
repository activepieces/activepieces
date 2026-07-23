import { HttpMethod, getAccessTokenOrThrow } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { clickupAuth } from '../../auth';
import { callClickUpApi, clickupCommon } from '../../common';

export const clickupUpdateTimeEntry = createAction({
  auth: clickupAuth,
  name: 'clickup_update_time_entry',
  displayName: 'Update Time Entry',
  description: 'Update an existing time entry by its ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Update fields on an existing tracked time entry (description, start, duration, billable flag) by its time entry ID. This sets the entry to the supplied values, so repeating with the same values leaves it unchanged (idempotent). Use Get Time Entry or List Time Entries first to obtain the entry ID.',
    idempotent: true,
  },
  props: {
    workspace_id: clickupCommon.workspace_id(true),
    timer_id: Property.ShortText({
      displayName: 'Time Entry ID',
      description:
        'The ID of the time entry to update. Obtain it from List Time Entries.',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'New note for the time entry.',
      required: false,
    }),
    start: Property.DateTime({
      displayName: 'Start',
      description: 'New start time for the entry.',
      required: false,
    }),
    duration: Property.Number({
      displayName: 'Duration (ms)',
      description: 'New length of the entry in milliseconds.',
      required: false,
    }),
    billable: Property.Checkbox({
      displayName: 'Billable',
      description: 'Whether the time entry is billable.',
      required: false,
    }),
  },
  async run(context) {
    const { workspace_id, timer_id, description, start, duration, billable } =
      context.propsValue;
    const auth = getAccessTokenOrThrow(context.auth);

    const body: Record<string, unknown> = {};
    if (description !== undefined) body['description'] = description;
    if (start) body['start'] = dayjs(start).valueOf();
    if (duration !== undefined) body['duration'] = duration;
    if (billable !== undefined) body['billable'] = billable;

    const response = await callClickUpApi(
      HttpMethod.PUT,
      `team/${workspace_id}/time_entries/${timer_id}`,
      auth,
      body
    );

    return response.body;
  },
});
