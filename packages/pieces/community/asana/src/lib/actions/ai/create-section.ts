import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaSectionOutputSchema } from '../../output-schemas';

export const asanaCreateSectionAction = createAction({
  auth: asanaAuth,
  name: 'create_section',
  classification: 'WRITE',
  displayName: 'Create Section',
  description: 'Create a section (list heading or board column) in an Asana project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new section in a project, at the end or before/after an existing section. Sections are list headings or board columns; move tasks into one with Move Task to Section. Each call creates a separate section, so retries duplicate.',
    idempotent: false,
  },
  outputSchema: asanaSectionOutputSchema,
  props: {
    project: Property.ShortText({
      displayName: 'Project GID',
      description: 'Gid of the project. Obtain it from List Projects or Search Workspace Objects.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Section Name',
      description: 'Name of the section, for example "In review". Cannot be empty.',
      required: true,
    }),
    insert_before: Property.ShortText({
      displayName: 'Insert Before Section',
      description: 'Gid of an existing section in this project to place the new one before. Cannot be combined with Insert After Section.',
      required: false,
    }),
    insert_after: Property.ShortText({
      displayName: 'Insert After Section',
      description: 'Gid of an existing section in this project to place the new one after. Cannot be combined with Insert Before Section.',
      required: false,
    }),
  },
  async run(context) {
    const { project, name, insert_before, insert_after } = context.propsValue;
    asanaUtils.assertNotBoth({
      first: insert_before,
      second: insert_after,
      firstLabel: 'Insert Before Section',
      secondLabel: 'Insert After Section',
    });
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/projects/${asanaUtils.pathSegment(project)}/sections`,
      operation: 'Create Section',
      query: { opt_fields: ASANA_FIELDS.section },
      data: {
        name,
        ...(asanaUtils.hasValue(insert_before) ? { insert_before: String(insert_before).trim() } : {}),
        ...(asanaUtils.hasValue(insert_after) ? { insert_after: String(insert_after).trim() } : {}),
      },
    });
  },
});
