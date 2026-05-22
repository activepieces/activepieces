import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { streakAuth } from '../../auth';
import { streakApiCall } from '../common/client';
import { flattenStreakBox } from '../common/flatten';
import { boxDropdown, pipelineDropdown, stageDropdown } from '../common/props';
import { StreakBox } from '../common/types';

export const updateBoxAction = createAction({
  auth: streakAuth,
  name: 'update_box',
  displayName: 'Update Box',
  description:
    'Update the name, notes, stage, assignees, or custom fields on an existing box.',
  props: {
    pipelineKey: pipelineDropdown,
    boxKey: boxDropdown,
    name: Property.ShortText({
      displayName: 'New Name',
      description: 'Leave empty to keep the existing name.',
      required: false,
    }),
    stageKey: stageDropdown,
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Replaces the existing notes. Leave empty to keep them unchanged.',
      required: false,
    }),
    assignedToEmails: Property.Array({
      displayName: 'Assigned To (Emails)',
      description:
        'Replaces the current assignees with these emails. Leave empty to keep assignees unchanged.',
      required: false,
    }),
    fields: Property.Object({
      displayName: 'Custom Fields',
      description:
        'Map of custom field key to value (e.g. {"1007": "Closed", "1039": 42}). Find the field keys in Streak under Pipeline Settings → Fields.',
      required: false,
    }),
  },
  async run(context) {
    const { boxKey, name, stageKey, notes, assignedToEmails, fields } =
      context.propsValue;

    const body: Record<string, unknown> = {};
    if (name) body['name'] = name;
    if (stageKey) body['stageKey'] = stageKey;
    if (notes) body['notes'] = notes;
    if (assignedToEmails && assignedToEmails.length > 0) {
      body['assignedToSharingEntries'] = (assignedToEmails as string[]).map(
        (email) => ({ email }),
      );
    }
    if (fields && Object.keys(fields).length > 0) {
      body['fields'] = fields;
    }

    const response = await streakApiCall<StreakBox>({
      apiKey: context.auth as unknown as string,
      method: HttpMethod.POST,
      path: `/api/v1/boxes/${boxKey}`,
      contentType: 'application/json',
      body,
    });

    return flattenStreakBox(response.body);
  },
});
