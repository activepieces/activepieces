import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { asanaClient, asanaUtils } from '../../common/client';
import { asanaMoveSectionOutputSchema } from '../../output-schemas';

export const asanaMoveSectionAction = createAction({
  auth: asanaAuth,
  name: 'move_section',
  classification: 'WRITE',
  displayName: 'Move Section',
  description: 'Reorder a section within its Asana project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Moves a section immediately before or after another section of the same project (exactly one of the two). Sections cannot move between projects. Repeating the same move converges, so it is safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaMoveSectionOutputSchema,
  props: {
    project: Property.ShortText({
      displayName: 'Project GID',
      description: 'Gid of the project both sections belong to. Obtain it from List Projects.',
      required: true,
    }),
    section: Property.ShortText({
      displayName: 'Section GID',
      description: 'Gid of the section to move. Obtain it from List Sections.',
      required: true,
    }),
    before_section: Property.ShortText({
      displayName: 'Before Section',
      description: 'Gid of the section to place it immediately before. Provide this or After Section.',
      required: false,
    }),
    after_section: Property.ShortText({
      displayName: 'After Section',
      description: 'Gid of the section to place it immediately after. Provide this or Before Section.',
      required: false,
    }),
  },
  async run(context) {
    const { project, section, before_section, after_section } = context.propsValue;
    asanaUtils.assertNotBoth({
      first: before_section,
      second: after_section,
      firstLabel: 'Before Section',
      secondLabel: 'After Section',
    });
    if (!asanaUtils.hasValue(before_section) && !asanaUtils.hasValue(after_section)) {
      throw new Error('Set Before Section or After Section to say where the section goes.');
    }
    await asanaClient.asanaEmpty({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/projects/${asanaUtils.pathSegment(project)}/sections/insert`,
      operation: 'Move Section',
      data: {
        section: section.trim(),
        ...(asanaUtils.hasValue(before_section) ? { before_section: String(before_section).trim() } : {}),
        ...(asanaUtils.hasValue(after_section) ? { after_section: String(after_section).trim() } : {}),
      },
    });
    return { success: true, project_gid: project.trim(), section_gid: section.trim() };
  },
});
