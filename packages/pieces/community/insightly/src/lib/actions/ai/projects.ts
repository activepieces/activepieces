import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { insightlyUtils } from '../../common/client';
import { insightlyAuth, insightlyCommon } from '../../common/common';
import { insightlyMappers, outputSchemas } from '../../common/output-schemas';
import { aiProps, PROJECT_STATUS_OPTIONS } from '../../common/props';

export const aiFindProjects = createAction({
  auth: insightlyAuth,
  name: 'ai_find_projects',
  classification: 'SEARCH',
  displayName: 'Find Projects',
  description: 'Find projects by exact name.',
  audience: 'ai',
  aiMetadata: {
    description: 'Searches Insightly projects by exact name, or lists them when no name is given. Returns project IDs and status. Read-only and safe to repeat.',
    idempotent: true,
  },
  outputSchema: outputSchemas['projectList'],
  props: {
    name: Property.ShortText({ displayName: 'Name', required: false }),
    limit: aiProps.limit(),
  },
  async run({ auth, propsValue }) {
    const name = insightlyUtils.optionalText(propsValue.name);
    const limit = insightlyUtils.clampLimit(propsValue.limit);
    const connection = await insightlyCommon.connect({ auth });
    const page = await insightlyCommon.findRecords({ connection, objectName: 'Projects', filter: name ? { field: 'PROJECT_NAME', value: name } : undefined, limit });
    const projects = page.records.map(insightlyMappers.project);
    return { count: projects.length, hasMore: page.hasMore, projects };
  },
});

export const aiCreateProject = createAction({
  auth: insightlyAuth,
  name: 'ai_create_project',
  classification: 'WRITE',
  displayName: 'Create Project',
  description: 'Create a project.',
  audience: 'ai',
  aiMetadata: {
    description: 'Creates a new Insightly project, optionally linked to the opportunity it came from. Not idempotent: each call creates another project, so run Find Projects first.',
    idempotent: false,
  },
  outputSchema: outputSchemas['project'],
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true }),
    status: Property.StaticDropdown<string, false>({ displayName: 'Status', required: false, options: { options: PROJECT_STATUS_OPTIONS } }),
    details: Property.LongText({ displayName: 'Details', required: false }),
    opportunityId: Property.Number({ displayName: 'Opportunity ID', required: false }),
  },
  async run({ auth, propsValue }) {
    const connection = await insightlyCommon.connect({ auth });
    const record = insightlyUtils.sanitizeRecord(
      await insightlyCommon.call({
        connection,
        method: HttpMethod.POST,
        path: '/Projects',
        body: insightlyUtils.compact({
          PROJECT_NAME: propsValue.name,
          STATUS: insightlyUtils.optionalText(propsValue.status) ?? 'NOT STARTED',
          PROJECT_DETAILS: propsValue.details,
          OPPORTUNITY_ID: propsValue.opportunityId,
        }),
      }),
    );
    return insightlyMappers.project(record);
  },
});
