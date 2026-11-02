import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_COLOR_OPTIONS, ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
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

export const asanaCreateProjectAction = createAction({
  auth: asanaAuth,
  name: 'create_project',
  classification: 'WRITE',
  displayName: 'Create Project',
  description: 'Create a new Asana project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new empty project in a workspace, with optional description, color, default view, privacy and dates. In an organization a Team gid (from List Teams) is optional; without one Asana creates a teamless project visible only to its members; to copy an existing project with its tasks use Duplicate Project instead. Each call creates a separate project, so retries duplicate.',
    idempotent: false,
  },
  outputSchema: asanaProjectOutputSchema,
  props: {
    workspace: Property.ShortText({
      displayName: 'Workspace GID',
      description: 'Gid of the workspace or organization, for example 1201234567890123. Obtain it from List Workspaces.',
      required: true,
    }),
    team: Property.ShortText({
      displayName: 'Team GID',
      description: 'Gid of the team to share the project with. Needed when the workspace is an organization; obtain it from List Teams. Asana is phasing this field out in favour of Create Membership with the team as member.',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Project Name',
      description: 'Name of the project, for example "Q4 Launch".',
      required: true,
    }),
    notes: Property.LongText({
      displayName: 'Description',
      description: 'Plain-text description of the project.',
      required: false,
    }),
    color: Property.StaticDropdown({
      displayName: 'Color',
      description: 'Project color. Leave empty for the default.',
      required: false,
      options: { disabled: false, options: ASANA_COLOR_OPTIONS },
    }),
    default_view: Property.StaticDropdown({
      displayName: 'Default View',
      description: 'View the project opens in. Leave empty for list.',
      required: false,
      options: { disabled: false, options: DEFAULT_VIEW_OPTIONS },
    }),
    privacy_setting: Property.StaticDropdown({
      displayName: 'Privacy',
      description: 'Who can see the project. Leave empty for the workspace default. Admins may restrict the allowed values.',
      required: false,
      options: { disabled: false, options: PRIVACY_OPTIONS },
    }),
    start_on: Property.ShortText({
      displayName: 'Start Date',
      description: 'Project start date in YYYY-MM-DD format. Requires a due date.',
      required: false,
    }),
    due_on: Property.ShortText({
      displayName: 'Due Date',
      description: 'Project due date in YYYY-MM-DD format.',
      required: false,
    }),
  },
  async run(context) {
    const { workspace, team, name, notes, color, default_view, privacy_setting, start_on, due_on } = context.propsValue;
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/projects',
      operation: 'Create Project',
      query: { opt_fields: ASANA_FIELDS.project },
      data: {
        workspace: workspace.trim(),
        name,
        ...(asanaUtils.hasValue(team) ? { team: String(team).trim() } : {}),
        ...(asanaUtils.hasValue(notes) ? { notes } : {}),
        ...(asanaUtils.hasValue(color) ? { color } : {}),
        ...(asanaUtils.hasValue(default_view) ? { default_view } : {}),
        ...(asanaUtils.hasValue(privacy_setting) ? { privacy_setting } : {}),
        ...(asanaUtils.hasValue(start_on) ? { start_on: asanaUtils.assertDate({ value: String(start_on), field: 'Start Date' }) } : {}),
        ...(asanaUtils.hasValue(due_on) ? { due_on: asanaUtils.assertDate({ value: String(due_on), field: 'Due Date' }) } : {}),
      },
    });
  },
});
