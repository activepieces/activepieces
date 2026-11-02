import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_COLOR_OPTIONS, ASANA_FIELDS, AsanaRecord, asanaClient, asanaProps, asanaUtils } from '../../common/client';
import { asanaProjectOutputSchema } from '../../output-schemas';

const DEFAULT_VIEW_OPTIONS = [
  { label: 'List', value: 'list' },
  { label: 'Board', value: 'board' },
  { label: 'Calendar', value: 'calendar' },
  { label: 'Timeline', value: 'timeline' },
];

const PRIVACY_OPTIONS = [
  { label: 'Public to workspace', value: 'public_to_workspace' },
  { label: 'Private (members only)', value: 'private' },
];

export const asanaUpdateProjectAction = createAction({
  auth: asanaAuth,
  name: 'update_project',
  classification: 'WRITE',
  displayName: 'Update Project',
  description: 'Change fields of an existing Asana project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates only the project fields you set (name, description, color, default view, privacy, owner, dates, archived); everything else is left unchanged. Archiving hides the project but keeps it, and Archived set to No restores it. Members and followers are changed with Add Project Members and Add Project Followers. Setting the same values again converges, so it is safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaProjectOutputSchema,
  props: {
    project: Property.ShortText({
      displayName: 'Project GID',
      description: 'Gid of the project to update. Obtain it from List Projects or Search Workspace Objects.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Project Name',
      description: 'New project name. Leave empty to keep it.',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Description',
      description: 'New plain-text description; replaces the current one. Leave empty to keep it.',
      required: false,
    }),
    color: Property.StaticDropdown({
      displayName: 'Color',
      description: 'New project color. Leave empty to keep it.',
      required: false,
      options: { disabled: false, options: ASANA_COLOR_OPTIONS },
    }),
    default_view: Property.StaticDropdown({
      displayName: 'Default View',
      description: 'New default view. Leave empty to keep it.',
      required: false,
      options: { disabled: false, options: DEFAULT_VIEW_OPTIONS },
    }),
    privacy_setting: Property.StaticDropdown({
      displayName: 'Privacy',
      description: 'New privacy setting. Making a project private hides it from non-members. Leave empty to keep it.',
      required: false,
      options: { disabled: false, options: PRIVACY_OPTIONS },
    }),
    owner: Property.ShortText({
      displayName: 'Owner',
      description: 'New owner: "me", an email address or a user gid. Leave empty to keep it.',
      required: false,
    }),
    start_on: Property.ShortText({
      displayName: 'Start Date',
      description: 'New start date in YYYY-MM-DD format. The project must have a due date.',
      required: false,
    }),
    due_on: Property.ShortText({
      displayName: 'Due Date',
      description: 'New due date in YYYY-MM-DD format.',
      required: false,
    }),
    archived: asanaProps.optionalBoolean({
      displayName: 'Archived',
      description: 'Yes archives the project, No unarchives it. Leave empty to keep the current state.',
    }),
  },
  async run(context) {
    const { project, name, notes, color, default_view, privacy_setting, owner, start_on, due_on, archived } =
      context.propsValue;
    const data: Record<string, unknown> = {
      ...(asanaUtils.hasValue(name) ? { name } : {}),
      ...(asanaUtils.hasValue(notes) ? { notes } : {}),
      ...(asanaUtils.hasValue(color) ? { color } : {}),
      ...(asanaUtils.hasValue(default_view) ? { default_view } : {}),
      ...(asanaUtils.hasValue(privacy_setting) ? { privacy_setting } : {}),
      ...(asanaUtils.hasValue(owner) ? { owner: String(owner).trim() } : {}),
      ...(asanaUtils.hasValue(start_on) ? { start_on: asanaUtils.assertDate({ value: String(start_on), field: 'Start Date' }) } : {}),
      ...(asanaUtils.hasValue(due_on) ? { due_on: asanaUtils.assertDate({ value: String(due_on), field: 'Due Date' }) } : {}),
      ...(archived !== undefined && archived !== null ? { archived } : {}),
    };
    asanaUtils.assertNotEmpty({
      patch: data,
      fields: 'Project Name, Description, Color, Default View, Privacy, Owner, Start Date, Due Date or Archived',
    });
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/projects/${asanaUtils.pathSegment(project)}`,
      operation: 'Update Project',
      query: { opt_fields: ASANA_FIELDS.project },
      data,
    });
  },
});
