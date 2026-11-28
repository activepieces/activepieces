import { InklyTemplate } from './client';

function emailKey(roleId: string): string {
  return `${EMAIL_PREFIX}${roleId}`;
}

function nameKey(roleId: string): string {
  return `${NAME_PREFIX}${roleId}`;
}

function prefilledKey(label: string): string {
  return `${PREFILLED_PREFIX}${Buffer.from(label, 'utf8').toString('hex')}`;
}

function uniqueLabels(fields: InklyTemplate['prefilled_fields']): InklyTemplate['prefilled_fields'] {
  return fields.filter((field, index) => fields.findIndex((other) => other.label === field.label) === index);
}

function read({ template, values }: { template: InklyTemplate; values: Record<string, unknown> }): TemplateInputs {
  const roles = template.roles.map((role) => {
    const name = text(values[nameKey(role.role_id)]);
    return {
      role_id: role.role_id,
      email: text(values[emailKey(role.role_id)]),
      ...(name ? { name } : {}),
    };
  });
  const missing = template.roles.find((role) => !text(values[emailKey(role.role_id)]));
  const prefilled = uniqueLabels(template.prefilled_fields).reduce<Record<string, string>>((result, field) => {
    const value = text(values[prefilledKey(field.label)]);
    return value ? { ...result, [field.label]: value } : result;
  }, {});
  return { roles, prefilled, missingRoleLabel: missing?.label ?? null };
}

function text(value: unknown): string {
  if (value === undefined || value === null) {
    return '';
  }
  return String(value).trim();
}

const EMAIL_PREFIX = 'role_email_';
const NAME_PREFIX = 'role_name_';
const PREFILLED_PREFIX = 'prefilled_';

export const inklyTemplateInputs = {
  emailKey,
  nameKey,
  prefilledKey,
  uniqueLabels,
  read,
  text,
};

export type TemplateInputs = {
  roles: Array<{ role_id: string; email: string; name?: string }>;
  prefilled: Record<string, string>;
  missingRoleLabel: string | null;
};
