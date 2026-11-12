import { createAction } from '@activepieces/pieces-framework';
import { youtrackAuth } from '../auth';
import { projectDropdown, resolveProject } from '../common';
import { youtrackClient } from '../common/client';
import { customFieldsHelper } from '../common/custom-fields';
import { listProjectCustomFieldsActionOutputSchema } from '../output-schemas';

export const listProjectCustomFieldsAction = createAction({
  auth: youtrackAuth,
  name: 'list_project_custom_fields',
  classification: 'SEARCH',
  outputSchema: listProjectCustomFieldsActionOutputSchema,
  displayName: 'List Project Custom Fields',
  description: 'Lists the custom fields of a project with their types and allowed values. If a field is missing, pass it as an entry with $type.',
  audience: 'both',
  aiMetadata: {
    description:
      'List the custom fields of one project (ID like "0-5" or short name like "APT"): each field\'s name, type, whether it takes several values, whether it is required, and its allowed values as a list of strings (value names, or user logins for user fields; up to 200 each). Reading the field settings of a project needs project admin rights; for other tokens the fields are read from an issue in the project (fields_source is "sample issue") and allowedValues is empty; fields hidden on that issue are missing. If a field is missing, pass it as an entry with $type. Call this before Create Issue or Update Issue to build the Custom Fields (JSON) map. Read-only and idempotent.',
    idempotent: true,
  },
  props: { project: projectDropdown },
  async run(context) {
    const value = youtrackClient.optionalText(context.propsValue.project) ?? '';
    const project = youtrackClient.isDatabaseId(value)
      ? { id: value, shortName: null }
      : await resolveProject({ auth: context.auth, value });
    const { fields, source } = await customFieldsHelper.fieldsForProject({ auth: context.auth, projectId: project.id, withValues: true });
    return {
      project_id: project.id,
      fields_source: source,
      fields: fields.map(customFieldsHelper.describeField),
    };
  },
});
