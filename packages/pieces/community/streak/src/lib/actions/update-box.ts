import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { streakAuth } from '../common/auth';
import { boxOutputSchema } from '../common/output-schemas';
import { getStreakBox, streakApiCall, writeBoxFields } from '../common/client';
import { flattenStreakBox, toEmailList } from '../common/flatten';
import { boxDropdown, pipelineDropdown, stageDropdown } from '../common/props';

export const updateBoxAction = createAction({
  auth: streakAuth,
  name: 'update_box',
  classification: 'WRITE',
  displayName: 'Update Box',
  description:
    'Update the name, notes, stage, assignees, or custom fields on an existing box.',
  audience: 'human',
  outputSchema: boxOutputSchema,
  props: {
    pipelineKey: pipelineDropdown,
    boxKey: boxDropdown,
    name: Property.ShortText({
      displayName: 'New Name',
      description: 'Leave empty to keep the existing name.',
      required: false,
    }),
    stageKey: stageDropdown,
    clearNotes: Property.Checkbox({
      displayName: 'Clear Notes',
      description: 'Remove the current notes. Ignored when Notes is filled in.',
      required: false,
    }),
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
    const { boxKey, name, stageKey, notes, clearNotes, assignedToEmails, fields } =
      context.propsValue;
    const apiKey = context.auth.secret_text;

    const body: Record<string, unknown> = {};
    if (name) body['name'] = name;
    if (stageKey) body['stageKey'] = stageKey;
    if (notes) body['notes'] = notes;
    else if (clearNotes === true) body['notes'] = '';
    const emails = toEmailList(assignedToEmails);
    if (emails.length > 0) {
      body['assignedToSharingEntries'] = emails.map((email) => ({ email }));
    }

    if (Object.keys(body).length > 0) {
      await streakApiCall({
        apiKey,
        method: HttpMethod.POST,
        path: `/api/v1/boxes/${encodeURIComponent(boxKey)}`,
        contentType: 'application/json',
        body,
      });
    }

    await writeBoxFields({
      apiKey,
      boxKey,
      fields: Object.entries(fields ?? {}).map(([fieldKey, value]) => ({
        fieldKey,
        value,
      })),
    });

    const box = await getStreakBox({ apiKey, boxKey });
    return flattenStreakBox(box);
  },
});
