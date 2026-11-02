import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaUtils } from '../../common/client';
import { asanaProjectBriefOutputSchema } from '../../output-schemas';

export const asanaCreateProjectBriefAction = createAction({
  auth: asanaAuth,
  name: 'create_project_brief',
  classification: 'WRITE',
  displayName: 'Create Project Brief',
  description: 'Create the brief (overview document) of an Asana project.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates the project brief, the overview document shown on a project\'s Overview tab, with a title and a body in rich text (preferred) or plain text, not both; plain text is escaped and wrapped in <body> for Asana. A project has at most one brief; use Get Project to find an existing one (project_brief) and Update Project Brief to change it. Available on the free plan. Not idempotent.',
    idempotent: false,
  },
  outputSchema: asanaProjectBriefOutputSchema,
  props: {
    project: Property.ShortText({
      displayName: 'Project GID',
      description: 'Gid of the project. Obtain it from List Projects or Search Workspace Objects.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Title of the brief, for example "Launch plan".',
      required: false,
    }),
    html_text: Property.LongText({
      displayName: 'HTML Text',
      description: 'Body in Asana rich text, wrapped in <body>...</body>. Cannot be combined with Text.',
      required: false,
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'Plain-text body; it is sent to Asana as escaped rich text inside <body>...</body>. Cannot be combined with HTML Text.',
      required: false,
    }),
  },
  async run(context) {
    const { project, title, html_text, text } = context.propsValue;
    asanaUtils.assertNotBoth({ first: html_text, second: text, firstLabel: 'HTML Text', secondLabel: 'Text' });
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/projects/${asanaUtils.pathSegment(project)}/project_briefs`,
      operation: 'Create Project Brief',
      query: { opt_fields: ASANA_FIELDS.projectBrief },
      data: {
        ...(asanaUtils.hasValue(title) ? { title } : {}),
        ...(asanaUtils.hasValue(html_text) ? { html_text } : {}),
        ...(typeof text === 'string' && asanaUtils.hasValue(text) ? { html_text: plainTextToRichText(text) } : {}),
      },
    });
  },
});

function plainTextToRichText(text: string): string {
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<body>${escaped}</body>`;
}
