import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaProps, asanaUtils } from '../../common/client';
import { asanaJobOutputSchema } from '../../output-schemas';

const PRIVACY_OPTIONS = [
  { label: 'Public to the workspace', value: 'public_to_workspace' },
  { label: 'Private', value: 'private' },
];

export const asanaInstantiateProjectTemplateAction = createAction({
  auth: asanaAuth,
  name: 'instantiate_project_template',
  classification: 'WRITE',
  displayName: 'Instantiate Project Template',
  description: 'Start creating a new Asana project from a project template (paid Asana plans only).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Starts an asynchronous job that creates a new project from a custom project template and returns the job (gid, status, new_project). The project may not be ready yet: poll Get Job with the returned job gid until status is succeeded. Get the template gid and its date and role gids from List Project Templates; when the template has dates, give each date variable a value in Requested Dates (gid 1 is the project start date, gid 2 the due date). Custom templates need a paid Asana plan. Each call creates another project, so retries duplicate.',
    idempotent: false,
  },
  outputSchema: asanaJobOutputSchema,
  props: {
    project_template: Property.ShortText({
      displayName: 'Project Template GID',
      description: 'Gid of the template. Obtain it from List Project Templates.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Project Name',
      description: 'Name of the new project.',
      required: true,
    }),
    team: Property.ShortText({
      displayName: 'Team GID',
      description: 'Organizations only: gid of the team for the new project. Leave empty to use the template\'s team.',
      required: false,
    }),
    privacy_setting: Property.StaticDropdown({
      displayName: 'Privacy',
      description: 'Who can see the new project. Leave empty for the default; organization admins may restrict the choices.',
      required: false,
      options: { disabled: false, options: PRIVACY_OPTIONS },
    }),
    requested_dates: Property.Array({
      displayName: 'Requested Dates',
      description: 'One row per date variable of the template: its gid (from requested_dates in List Project Templates; 1 = project start date, 2 = project due date) and a date in YYYY-MM-DD format.',
      required: false,
      properties: {
        gid: Property.ShortText({ displayName: 'Date Variable GID', required: true }),
        value: Property.ShortText({ displayName: 'Date (YYYY-MM-DD)', required: true }),
      },
    }),
    requested_roles: Property.Array({
      displayName: 'Requested Roles',
      description: 'One row per template role: its gid (from requested_roles in List Project Templates) and the user to assign, as "me", an email address or a user gid.',
      required: false,
      properties: {
        gid: Property.ShortText({ displayName: 'Role GID', required: true }),
        value: Property.ShortText({ displayName: 'User', required: true }),
      },
    }),
    is_strict: asanaProps.optionalBoolean({
      displayName: 'Strict Dates',
      description: 'Yes to fail when any date variable of the template has no value in Requested Dates; No to leave missing dates empty. Leave empty for the Asana default.',
    }),
  },
  async run(context) {
    const props = context.propsValue;
    const requestedDates = asanaUtils
      .toGidValuePairs({ value: props.requested_dates, field: 'Requested Dates' })
      .map((pair) => ({ gid: pair.gid, value: asanaUtils.assertDate({ value: pair.value, field: `Requested Dates value for gid ${pair.gid}` }) }));
    const requestedRoles = asanaUtils.toGidValuePairs({ value: props.requested_roles, field: 'Requested Roles' });
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/project_templates/${asanaUtils.pathSegment(props.project_template)}/instantiateProject`,
      operation: 'Instantiate Project Template',
      query: { opt_fields: ASANA_FIELDS.job },
      data: {
        name: props.name,
        ...(asanaUtils.hasValue(props.team) ? { team: String(props.team).trim() } : {}),
        ...(asanaUtils.hasValue(props.privacy_setting) ? { privacy_setting: props.privacy_setting } : {}),
        ...(requestedDates.length > 0 ? { requested_dates: requestedDates } : {}),
        ...(requestedRoles.length > 0 ? { requested_roles: requestedRoles } : {}),
        ...(typeof props.is_strict === 'boolean' ? { is_strict: props.is_strict } : {}),
      },
    });
  },
});
