import { Property } from '@activepieces/pieces-framework';

function id<R extends boolean>({ required, displayName, description }: AiPropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function text<R extends boolean>({ required, displayName, description }: AiPropParams<R>) {
  return Property.ShortText({ displayName, description, required });
}

function longText<R extends boolean>({ required, displayName, description }: AiPropParams<R>) {
  return Property.LongText({ displayName, description, required });
}

function number<R extends boolean>({ required, displayName, description }: AiPropParams<R>) {
  return Property.Number({ displayName, description, required });
}

function json<R extends boolean>({ required, displayName, description }: AiPropParams<R>) {
  return Property.Json({ displayName, description, required });
}

function idList<R extends boolean>({ required, displayName, description }: AiPropParams<R>) {
  return Property.Array({ displayName, description, required });
}

function bool<R extends boolean>({ required, displayName, description }: AiPropParams<R>) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    options: { disabled: false, options: BOOL_OPTIONS },
  });
}

function choice<R extends boolean>({ required, displayName, description, values }: AiPropParams<R> & { values: string[] }) {
  return Property.StaticDropdown({
    displayName,
    description,
    required,
    options: { disabled: false, options: values.map((value) => ({ label: value, value })) },
  });
}

function limit<R extends boolean>({ required, description = 'Maximum number of results to return.' }: { required: R; description?: string }) {
  return Property.Number({ displayName: 'Limit', description, required });
}

function offset<R extends boolean>({ required }: { required: R }) {
  return Property.Number({
    displayName: 'Offset',
    description: 'Number of results to skip, for paging. Defaults to 0.',
    required,
  });
}

function silent<R extends boolean>({ required }: { required: R }) {
  return bool({
    required,
    displayName: 'Silent',
    description: '"true" keeps the change out of the stream and sends no notifications. Defaults to "false".',
  });
}

function hook<R extends boolean>({ required }: { required: R }) {
  return bool({
    required,
    displayName: 'Run Hooks',
    description: '"false" skips the webhooks for this change. Defaults to "true".',
  });
}

const BOOL_OPTIONS = [
  { label: 'true', value: 'true' },
  { label: 'false', value: 'false' },
];

export const podioAiProps = { id, text, longText, number, json, idList, bool, choice, limit, offset, silent, hook };

export type AiPropParams<R extends boolean> = { required: R; displayName: string; description: string };
