import { Property } from '@activepieces/pieces-framework';

export function requirePositiveInt({
  value,
  label,
}: {
  value: unknown;
  label: string;
}): number {
  const parsed =
    typeof value === 'string' && value.trim() !== '' ? Number(value) : value;
  if (typeof parsed !== 'number' || !Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive whole number.`);
  }
  return parsed;
}

export function optionalPositiveInt({
  value,
  label,
}: {
  value: unknown;
  label: string;
}): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return requirePositiveInt({ value, label });
}

export function pagingInput({
  page,
  perPage,
}: {
  page: unknown;
  perPage: unknown;
}): { page?: number; perPage?: number } {
  const pageNumber = optionalPositiveInt({ value: page, label: 'Page' });
  const size = optionalPositiveInt({ value: perPage, label: 'Per Page' });
  if (size !== undefined && size > 100) {
    throw new Error('Per Page must be between 1 and 100.');
  }
  return { page: pageNumber, perPage: size };
}

export function requireText({
  value,
  label,
}: {
  value: unknown;
  label: string;
}): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} is required.`);
  }
  return value.trim();
}

export function optionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function triStateValue(value: unknown): boolean | undefined {
  if (value === true || value === 'true') {
    return true;
  }
  if (value === false || value === 'false') {
    return false;
  }
  return undefined;
}

export function stringList({
  value,
  label,
}: {
  value: unknown;
  label: string;
}): string[] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be a list.`);
  }
  const items = value
    .map((item) => String(item).trim())
    .filter((item) => item.length > 0);
  return items.length > 0 ? items : undefined;
}

export function idList({
  value,
  label,
}: {
  value: unknown;
  label: string;
}): number[] | undefined {
  const items = stringList({ value, label });
  return items?.map((item) => requirePositiveInt({ value: item, label }));
}

export function optionalIsoDate({
  value,
  label,
}: {
  value: unknown;
  label: string;
}): string | undefined {
  const text = optionalText(value);
  if (text === undefined) {
    return undefined;
  }
  if (Number.isNaN(Date.parse(text))) {
    throw new Error(
      `${label} must be an ISO 8601 date, e.g. 2026-10-11 or 2026-10-11T09:00:00Z.`
    );
  }
  return text;
}

export function requireDuration({
  value,
  label,
}: {
  value: unknown;
  label: string;
}): string {
  const text = requireText({ value, label });
  const compact = text.replace(/\s+/g, '');
  if (compact.length > 32 || !/^(\d+mo|\d+[wdhms])+$/.test(compact)) {
    throw new Error(
      `${label} must be a GitLab duration such as 1h30m, 2d or 1w.`
    );
  }
  return compact;
}

export const gitlabProps = {
  projectId: (
    description = 'Numeric project ID or full path, e.g. `my-group/my-project`. Shown on the project overview page.'
  ) =>
    Property.ShortText({
      displayName: 'Project ID or Path',
      description,
      required: true,
    }),
  issueIid: () =>
    Property.Number({
      displayName: 'Issue IID',
      description:
        'The issue number inside the project (the `iid`, shown as #12 in GitLab), not the global issue ID.',
      required: true,
    }),
  mergeRequestIid: () =>
    Property.Number({
      displayName: 'Merge Request IID',
      description:
        'The merge request number inside the project (the `iid`, shown as !12 in GitLab), not the global ID.',
      required: true,
    }),
  noteId: () =>
    Property.Number({
      displayName: 'Note ID',
      description: 'Numeric ID of the comment (note).',
      required: true,
    }),
  sha: (displayName = 'Commit SHA') =>
    Property.ShortText({
      displayName,
      description:
        'Commit SHA, or a branch or tag name that resolves to a commit.',
      required: true,
    }),
  branch: (displayName = 'Branch', description = 'Branch name.') =>
    Property.ShortText({ displayName, description, required: true }),
  page: () =>
    Property.Number({
      displayName: 'Page',
      description:
        'Page number to fetch, starting at 1. Use `nextPage` from the previous result to continue.',
      required: false,
    }),
  perPage: () =>
    Property.Number({
      displayName: 'Per Page',
      description: 'Items per page, 1 to 100. Defaults to 20.',
      required: false,
    }),
  sort: () =>
    Property.StaticDropdown({
      displayName: 'Sort',
      required: false,
      options: {
        options: [
          { label: 'Descending', value: 'desc' },
          { label: 'Ascending', value: 'asc' },
        ],
      },
    }),
  triState: (displayName: string, description: string) =>
    Property.StaticDropdown<string>({
      displayName,
      description,
      required: false,
      options: {
        options: [
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
      },
    }),
};
