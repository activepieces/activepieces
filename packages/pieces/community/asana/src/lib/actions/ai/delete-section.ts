import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { asanaClient, asanaUtils } from '../../common/client';
import { asanaDeleteSectionOutputSchema } from '../../output-schemas';

export const asanaDeleteSectionAction = createAction({
  auth: asanaAuth,
  name: 'delete_section',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Section',
  description: 'Delete an empty section from an Asana project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes a section. Asana only deletes empty sections and never the last remaining section of a project, so move its tasks out first with Move Task to Section. Not idempotent: repeating the call on the same section fails.',
    idempotent: false,
  },
  outputSchema: asanaDeleteSectionOutputSchema,
  props: {
    section: Property.ShortText({
      displayName: 'Section GID',
      description: 'Gid of the section to delete. Obtain it from List Sections.',
      required: true,
    }),
  },
  async run(context) {
    const section = context.propsValue.section.trim();
    await asanaClient.asanaEmpty({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/sections/${asanaUtils.pathSegment(section)}`,
      operation: 'Delete Section',
    });
    return { success: true, section_gid: section };
  },
});
