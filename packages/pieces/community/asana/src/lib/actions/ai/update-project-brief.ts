import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaProjectBriefOutputSchema } from '../../output-schemas';

export const asanaUpdateProjectBriefAction = createAction({
  auth: asanaAuth,
  name: 'update_project_brief',
  classification: 'WRITE',
  displayName: 'Update Project Brief',
  description: 'Change the title or body of an Asana project brief.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates only the brief fields you set: the title, and/or the body in rich text (preferred) or plain text, not both. A new body replaces the whole current body. Setting the same values again converges, so it is safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaProjectBriefOutputSchema,
  props: {
    project_brief: Property.ShortText({
      displayName: 'Project Brief GID',
      description: 'Gid of the project brief. Obtain it from the project_brief field of Get Project.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'New title. Leave empty to keep it.',
      required: false,
    }),
    html_text: Property.LongText({
      displayName: 'HTML Text',
      description: 'New body in Asana rich text, wrapped in <body>...</body>. Cannot be combined with Text.',
      required: false,
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'New plain-text body. Cannot be combined with HTML Text.',
      required: false,
    }),
  },
  async run(context) {
    const { project_brief, title, html_text, text } = context.propsValue;
    asanaUtils.assertNotBoth({ first: html_text, second: text, firstLabel: 'HTML Text', secondLabel: 'Text' });
    const data: Record<string, unknown> = {
      ...(asanaUtils.hasValue(title) ? { title } : {}),
      ...(asanaUtils.hasValue(html_text) ? { html_text } : {}),
      ...(asanaUtils.hasValue(text) ? { text } : {}),
    };
    asanaUtils.assertNotEmpty({ patch: data, fields: 'Title, HTML Text or Text' });
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/project_briefs/${asanaUtils.pathSegment(project_brief)}`,
      operation: 'Update Project Brief',
      query: { opt_fields: ASANA_FIELDS.projectBrief },
      data,
    });
  },
});
