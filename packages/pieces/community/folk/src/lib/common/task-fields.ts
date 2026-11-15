import { Property } from '@activepieces/pieces-framework';
import { folkClient } from './client';
import { folkFields } from './fields';

function taskProps() {
  return {
    description: Property.LongText({ displayName: 'Description', description: 'Task details.', required: false }),
    dueTime: Property.ShortText({ displayName: 'Due Time', description: 'Time of day as HH:mm (24h), e.g. 15:00.', required: false }),
    recurrence: Property.StaticDropdown({
      displayName: 'Repeat',
      description: 'How often the task repeats.',
      required: false,
      options: { options: RECURRENCES.map((value) => ({ label: value, value })) },
    }),
    assignees: Property.Array({
      displayName: 'Assignees',
      description: 'User IDs (usr_...) or emails of workspace users; use one kind only. If empty on create, Folk assigns the API key owner.',
      required: false,
    }),
    isPublic: Property.StaticDropdown({
      displayName: 'Visible To Everyone',
      description: 'Yes: the whole workspace sees the task. No: only assignees. Empty leaves it as is (new tasks: Folk default, visible).',
      required: false,
      options: {
        options: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
      },
    }),
  };
}

function entityRef({ value, label }: { value: unknown; label: string }): { id: string } {
  const id = folkClient.idSegment({ value, label });
  if (!/^(per|com|obj)_/.test(id)) {
    throw new Error(`${label} must be a person (per_...), company (com_...) or object (obj_...) ID.`);
  }
  return { id };
}

function dueTimeValue({ value }: { value: unknown }): string | undefined {
  const text = folkFields.textValue({ value });
  if (text === undefined) {
    return undefined;
  }
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(text)) {
    throw new Error('Due Time must be HH:mm in 24-hour time, e.g. 09:30.');
  }
  return text;
}

function recurrenceValue({ value }: { value: unknown }): string | undefined {
  const text = folkFields.textValue({ value });
  if (text === undefined) {
    return undefined;
  }
  if (!RECURRENCES.includes(text)) {
    throw new Error(`Repeat must be one of: ${RECURRENCES.join(', ')}.`);
  }
  return text;
}

function assigneesValue({ value }: { value: unknown }): { id: string }[] | { email: string }[] | undefined {
  const list = folkFields.stringList({ value, label: 'Assignees', max: 50 });
  if (list === undefined || list.length === 0) {
    return undefined;
  }
  const ids = list.filter((entry) => entry.startsWith('usr_'));
  if (ids.length === list.length) {
    return ids.map((id) => ({ id }));
  }
  if (ids.length > 0 || !list.every((entry) => entry.includes('@'))) {
    throw new Error('Assignees must be all user IDs (usr_...) or all emails, not a mix.');
  }
  return list.map((email) => ({ email }));
}

function commonBody({ props }: { props: TaskInput }): Record<string, unknown> {
  const description = folkFields.textValue({ value: props.description });
  const dueTime = dueTimeValue({ value: props.dueTime });
  const recurrence = recurrenceValue({ value: props.recurrence });
  const assignees = assigneesValue({ value: props.assignees });
  return {
    ...(description !== undefined ? { description } : {}),
    ...(dueTime !== undefined ? { dueTime } : {}),
    ...(recurrence !== undefined ? { recurrenceFrequency: recurrence } : {}),
    ...(assignees !== undefined ? { assignedUsers: assignees } : {}),
    ...(props.isPublic === 'yes' ? { isPublic: true } : props.isPublic === 'no' ? { isPublic: false } : {}),
  };
}

const RECURRENCES = ['weekday', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'];

export const folkTaskFields = { taskProps, entityRef, commonBody };

type TaskInput = { description?: unknown; dueTime?: unknown; recurrence?: unknown; assignees?: unknown; isPublic?: unknown };
