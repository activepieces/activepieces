import { createAction, Property } from '@activepieces/pieces-framework';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaProps, asanaUtils } from '../../common/client';
import { asanaSectionListOutputSchema } from '../../output-schemas';

export const asanaListSectionsAction = createAction({
  auth: asanaAuth,
  name: 'list_sections',
  classification: 'SEARCH',
  displayName: 'List Sections',
  description: 'List the sections of an Asana project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the sections (list headings or board columns) of a project in display order. Use it to find the section gid for Move Task to Section, List Section Tasks or Move Section. Paginated with next_offset; read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaSectionListOutputSchema,
  props: {
    project: Property.ShortText({
      displayName: 'Project GID',
      description: 'Gid of the project. Obtain it from List Projects or Search Workspace Objects.',
      required: true,
    }),
    limit: asanaProps.limit({ noun: 'sections' }),
    offset: asanaProps.offset(),
  },
  async run(context) {
    const { project, limit, offset } = context.propsValue;
    return asanaClient.asanaListPage<AsanaRecord>({
      auth: context.auth,
      path: `/projects/${asanaUtils.pathSegment(project)}/sections`,
      operation: 'List Sections',
      query: { opt_fields: ASANA_FIELDS.section },
      limit,
      offset,
    });
  },
});
