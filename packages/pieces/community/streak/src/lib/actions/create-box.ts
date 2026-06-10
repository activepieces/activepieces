import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { streakAuth } from '../common/auth';
import { streakApiCall } from '../common/client';
import { flattenStreakBox } from '../common/flatten';
import { pipelineDropdown, stageDropdown } from '../common/props';
import { StreakBox } from '../common/types';

export const createBoxAction = createAction({
  auth: streakAuth,
  name: 'create_box',
  displayName: 'Create Box',
  description: 'Create a new box (record) in a pipeline.',
  props: {
    pipelineKey: pipelineDropdown,
    name: Property.ShortText({
      displayName: 'Name',
      description:
        'The display name for this box (e.g. the deal name or the candidate name).',
      required: true,
    }),
    stageKey: stageDropdown,
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Free-form notes attached to the box.',
      required: false,
    }),
    assignedToEmails: Property.Array({
      displayName: 'Assigned To (Emails)',
      description:
        'Email addresses of Streak users to assign to this box. Leave empty for no assignees.',
      required: false,
    }),
  },
  async run(context) {
    const { pipelineKey, name, stageKey, notes, assignedToEmails } =
      context.propsValue;

    const body: Record<string, unknown> = { name };
    if (stageKey) body['stageKey'] = stageKey;
    if (notes) body['notes'] = notes;
    if (assignedToEmails && assignedToEmails.length > 0) {
      body['assignedToSharingEntries'] = (assignedToEmails as string[]).map(
        (email) => ({ email }),
      );
    }

    const response = await streakApiCall<StreakBox>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/api/v2/pipelines/${pipelineKey}/boxes`,
      contentType: 'application/json',
      body,
    });

    return flattenStreakBox(response.body);
  },
});
