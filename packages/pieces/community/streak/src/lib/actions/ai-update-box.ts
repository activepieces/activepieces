import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { streakAuth } from '../common/auth';
import { boxOutputSchema } from '../common/output-schemas';
import { getStreakBox, streakApiCall, writeBoxFields } from '../common/client';
import { flattenStreakBox } from '../common/flatten';
import { StreakField } from '../common/types';

export const aiUpdateBoxAction = createAction({
  auth: streakAuth,
  name: 'ai_update_box',
  classification: 'WRITE',
  displayName: 'Update Box',
  description:
    'Update the name, notes, stage, or custom field values of an existing box by its box key.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Update an existing Streak box identified by box_key. Only the inputs you provide change: name, notes (set clear_notes to remove them), stage_key (from List Stages), and field_updates, a list of {field_key, value} pairs where field_key comes from List Pipeline Fields. For DROPDOWN fields pass the option key, for DATE fields an ISO date or epoch milliseconds, for CHECKBOX fields "true" or "false". Returns the box as it is after the update. Idempotent: repeating with the same values leaves the box in the same state.',
    idempotent: true,
  },
  outputSchema: boxOutputSchema,
  props: {
    box_key: Property.ShortText({
      displayName: 'Box Key',
      description: 'The key of the box to update (from Find Boxes or List Boxes).',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'New name for the box. Omit to keep the current name.',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description:
        'New notes for the box, replacing the current notes. Omit to keep them.',
      required: false,
    }),
    clear_notes: Property.Checkbox({
      displayName: 'Clear Notes',
      description: 'Set to true to remove the current notes. Ignored when Notes is given.',
      required: false,
    }),
    stage_key: Property.ShortText({
      displayName: 'Stage Key',
      description: 'Key of the stage to move the box to (from List Stages).',
      required: false,
    }),
    field_updates: Property.Array({
      displayName: 'Custom Field Updates',
      description: 'Custom field values to set on the box.',
      required: false,
      properties: {
        field_key: Property.ShortText({
          displayName: 'Field Key',
          description: 'The custom field key (from List Pipeline Fields).',
          required: true,
        }),
        value: Property.ShortText({
          displayName: 'Value',
          description: 'The new value for the field.',
          required: true,
        }),
      },
    }),
  },
  async run(context) {
    const { box_key, name, notes, clear_notes, stage_key, field_updates } =
      context.propsValue;
    const apiKey = context.auth.secret_text;
    const boxKey = box_key.trim();

    const updates = parseFieldUpdates(field_updates);
    const coercedFields =
      updates.length > 0
        ? await coerceFieldUpdates({ apiKey, boxKey, updates })
        : [];

    const body: Record<string, unknown> = {};
    if (name) body['name'] = name;
    if (notes) body['notes'] = notes;
    else if (clear_notes === true) body['notes'] = '';
    if (stage_key) body['stageKey'] = stage_key.trim();

    if (Object.keys(body).length > 0) {
      await streakApiCall({
        apiKey,
        method: HttpMethod.POST,
        path: `/api/v1/boxes/${encodeURIComponent(boxKey)}`,
        contentType: 'application/json',
        body,
      });
    }

    await writeBoxFields({ apiKey, boxKey, fields: coercedFields });

    const box = await getStreakBox({ apiKey, boxKey });
    return flattenStreakBox(box);
  },
});

function parseFieldUpdates(
  raw: unknown[] | undefined,
): Array<{ fieldKey: string; value: string }> {
  const updates: Array<{ fieldKey: string; value: string }> = [];
  for (const item of raw ?? []) {
    if (typeof item !== 'object' || item === null) {
      continue;
    }
    const fieldKey = 'field_key' in item ? item.field_key : undefined;
    const value = 'value' in item ? item.value : undefined;
    if (typeof fieldKey !== 'string' || fieldKey.trim() === '') {
      continue;
    }
    updates.push({
      fieldKey: fieldKey.trim(),
      value: value === undefined || value === null ? '' : String(value),
    });
  }
  return updates;
}

async function coerceFieldUpdates({
  apiKey,
  boxKey,
  updates,
}: {
  apiKey: string;
  boxKey: string;
  updates: Array<{ fieldKey: string; value: string }>;
}): Promise<Array<{ fieldKey: string; value: unknown }>> {
  const box = await getStreakBox({ apiKey, boxKey });
  const response = await streakApiCall<StreakField[]>({
    apiKey,
    method: HttpMethod.GET,
    path: `/api/v1/pipelines/${encodeURIComponent(box.pipelineKey)}/fields`,
  });
  const fieldsByKey = new Map(
    (response.body ?? []).map((field) => [field.key, field]),
  );
  const unknownKeys = updates
    .map((u) => u.fieldKey)
    .filter((key) => !fieldsByKey.has(key));
  if (unknownKeys.length > 0) {
    throw new Error(
      `Unknown custom field key(s) for this box's pipeline: ${unknownKeys.join(', ')}. Use List Pipeline Fields to get valid keys.`,
    );
  }
  return updates.map(({ fieldKey, value }) => ({
    fieldKey,
    value: coerceValue({ type: fieldsByKey.get(fieldKey)?.type, value, fieldKey }),
  }));
}

function coerceValue({
  type,
  value,
  fieldKey,
}: {
  type: string | undefined;
  value: string;
  fieldKey: string;
}): unknown {
  const trimmed = value.trim();
  if (type === 'CHECKBOX') {
    if (trimmed.toLowerCase() === 'true') return true;
    if (trimmed.toLowerCase() === 'false') return false;
    throw new Error(`Field ${fieldKey} is a checkbox; use "true" or "false".`);
  }
  if (type === 'DATE') {
    if (trimmed === '') return null;
    const epoch = /^-?\d+$/.test(trimmed) ? Number(trimmed) : Date.parse(trimmed);
    if (Number.isNaN(epoch)) {
      throw new Error(
        `Field ${fieldKey} is a date; use an ISO date or epoch milliseconds.`,
      );
    }
    return epoch;
  }
  if (type === 'NUMBER') {
    if (trimmed === '') return null;
    const num = Number(trimmed);
    if (Number.isNaN(num)) {
      throw new Error(`Field ${fieldKey} is a number; "${value}" is not numeric.`);
    }
    return num;
  }
  return value;
}
