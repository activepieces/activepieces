import { Property } from '@activepieces/pieces-framework';
import { encodeSegment } from './client';
import { requirePositiveInt } from './props';

export function groupPath(groupId: string | number): string {
  return `/groups/${encodeSegment({ value: groupId, label: 'Group ID or path' })}`;
}

export function requireAccessLevel({ value, label }: { value: unknown; label: string }): number {
  const level = requirePositiveInt({ value: value, label: label });
  if (!ACCESS_LEVELS.some((item) => item.value === level)) {
    throw new Error(`${label} must be one of ${ACCESS_LEVELS.map((item) => item.value).join(', ')}.`);
  }
  return level;
}

export function optionalAccessLevel({ value, label }: { value: unknown; label: string }): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return requireAccessLevel({ value: value, label: label });
}

export function requireColor({ value, label }: { value: unknown; label: string }): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} is required.`);
  }
  const color = value.trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(color) && !/^#[0-9a-fA-F]{3}$/.test(color) && !/^[a-zA-Z]{3,30}$/.test(color)) {
    throw new Error(`${label} must be a hex color such as #FF0000 or a CSS color name.`);
  }
  return color;
}

export function optionalDay({ value, label }: { value: unknown; label: string }): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new Error(`${label} must be a date in YYYY-MM-DD format.`);
  }
  const text = value.trim();
  if (text.length === 0) {
    return undefined;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(Date.parse(text))) {
    throw new Error(`${label} must be a date in YYYY-MM-DD format.`);
  }
  return text;
}

export const ACCESS_LEVELS = [
  { label: 'Guest', value: 10 },
  { label: 'Planner', value: 15 },
  { label: 'Reporter', value: 20 },
  { label: 'Developer', value: 30 },
  { label: 'Maintainer', value: 40 },
  { label: 'Owner', value: 50 },
];

export const adminProps = {
  groupId: (description = 'Numeric group ID or full path, e.g. `my-group/sub-group`.') =>
    Property.ShortText({ displayName: 'Group ID or Path', description, required: true }),
  userId: (description = 'Numeric GitLab user ID. Find it with List Users.') =>
    Property.Number({ displayName: 'User ID', description, required: true }),
  pipelineId: () =>
    Property.Number({ displayName: 'Pipeline ID', description: 'Numeric pipeline ID (not the pipeline IID). Find it with List Pipelines.', required: true }),
  jobId: () =>
    Property.Number({ displayName: 'Job ID', description: 'Numeric job ID. Find it with List Pipeline Jobs.', required: true }),
  hookId: () =>
    Property.Number({ displayName: 'Webhook ID', description: 'Numeric webhook ID. Find it with List Project Webhooks.', required: true }),
  milestoneId: () =>
    Property.Number({
      displayName: 'Milestone ID',
      description: 'The global milestone `id` (not the `iid` shown in the GitLab UI). Find it with List Milestones.',
      required: true,
    }),
  labelId: () =>
    Property.ShortText({ displayName: 'Label ID or Name', description: 'Numeric label ID or the exact label name.', required: true }),
  visibility: (description: string) =>
    Property.StaticDropdown<string>({
      displayName: 'Visibility',
      description,
      required: false,
      options: {
        options: [
          { label: 'Private', value: 'private' },
          { label: 'Internal', value: 'internal' },
          { label: 'Public', value: 'public' },
        ],
      },
    }),
  accessLevel: (displayName: string, required: boolean, description: string) =>
    Property.StaticDropdown<number>({ displayName, description, required, options: { options: ACCESS_LEVELS } }),
  search: (description = 'Text to match against names.') => Property.ShortText({ displayName: 'Search', description, required: false }),
};
