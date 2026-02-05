import { createAction, Property } from '@activepieces/pieces-framework';
import { jiraCloudAuth } from '../../auth';
import { HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { sendJiraRequest } from '../common';
import { getIssueIdDropdown, getProjectIdDropdown } from '../common/props';

function mapFieldNames(
  fields: Record<string, any>,
  fieldNames: Record<string, string>
) {
  const mappedFields = {} as Record<string, any>;

  for (const [fieldId, fieldValue] of Object.entries(fields)) {
    const fieldName = fieldNames?.[fieldId];
    if (fieldName) {
      mappedFields[fieldName] = fieldValue;
    } else {
      // fallback in case field cannot be mapped (but this should not happen)
      mappedFields[fieldId] = fieldValue;
    }
  }

  return mappedFields;
}

export const getIssueAction = createAction({
  auth: jiraCloudAuth,
  name: 'get_issue',
  displayName: 'Get Issue',
  description: 'Get issue data.',
  props: {
    projectId: getProjectIdDropdown(),
    issueId: getIssueIdDropdown({ refreshers: ['projectId'] }),
    expand: Property.StaticMultiSelectDropdown({
      displayName: 'Expand',
      description:
        'Include additional information about the issue in the response',
      required: false,
      options: {
        options: [
          {
            label: 'Rendered Fields',
            value: 'renderedFields',
          },
          {
            label: 'Names',
            value: 'names',
          },
          {
            label: 'Schema',
            value: 'schema',
          },
          {
            label: 'Transitions',
            value: 'transitions',
          },
          {
            label: 'Edit Meta',
            value: 'editmeta',
          },
          {
            label: 'Changelog',
            value: 'changelog',
          },
        ],
      },
    }),
    mapNames: Property.Checkbox({
      displayName: 'Map Field Names',
      description: `
Map human readable names to Fields, Rendered Fields, Schema and Edit Meta.
Notes:
- This would implicitly add "names" to the expand field
- If there are fields with the same name, they may be overridden
				`.trim(),
      required: true,
      defaultValue: false,
    }),
    mapTransitions: Property.Checkbox({
      displayName: 'Map Transition Names',
      description: `
Map human readable names to Transitions.
Notes:
- If there are transitions with the same name, they may be overridden
- This changes the original data structure from list to map
				`.trim(),
      required: true,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { issueId, expand, mapNames, mapTransitions } = context.propsValue;

    const queryParams = {} as QueryParams;
    let expandParams = expand as string[];

    // implicitly expand names which is needed for mapping
    if (mapNames) {
      expandParams = [...new Set(expandParams).add('names')];
    }

    if (expandParams) {
      queryParams['expand'] = expandParams.join(',');
    }

    // https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-issues/#api-rest-api-3-issue-issueidorkey-get
    const response = await sendJiraRequest({
      method: HttpMethod.GET,
      url: `issue/${issueId}`,
      auth: context.auth,
      queryParams: queryParams,
    });

    const data = response.body;

    if (mapNames) {
      const fieldNames = data.names || {};

      const mappedFields = mapFieldNames(data.fields, fieldNames);
      data['fields'] = mappedFields;

      if (data.renderedFields) {
        const mappedRenderedFields = mapFieldNames(
          data.renderedFields,
          fieldNames
        );
        data['renderedFields'] = mappedRenderedFields;
      }

      if (data.schema) {
        const mappedSchemaFields = mapFieldNames(data.schema, fieldNames);
        data['schema'] = mappedSchemaFields;
      }

      if (data.editmeta?.fields) {
        const mappedEditmetaFields = mapFieldNames(
          data.editmeta.fields,
          fieldNames
        );
        data['editmeta']['fields'] = mappedEditmetaFields;
      }
    }

    if (mapTransitions && data.transitions) {
      const mappedTransitions = data.transitions.reduce(
        (acc: Record<string, any>, transition: any) => {
          acc[transition.name] = transition;
          return acc;
        },
        {}
      );

      data['transitions'] = mappedTransitions;
    }

    return data;
  },
});
