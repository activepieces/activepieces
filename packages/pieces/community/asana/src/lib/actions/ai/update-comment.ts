import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { asanaAuth } from '../../auth';
import { ASANA_FIELDS, AsanaRecord, asanaClient, asanaProps, asanaUtils } from '../../common/client';
import { asanaStoryOutputSchema } from '../../output-schemas';

export const asanaUpdateCommentAction = createAction({
  auth: asanaAuth,
  name: 'update_comment',
  classification: 'WRITE',
  displayName: 'Update Comment',
  description: 'Edit or pin a comment on an Asana task.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Replaces the text of a comment (plain text or rich text, one of the two) and/or pins or unpins it; unset fields stay unchanged. Only comment stories can be edited, and usually only by their author. Setting the same values again converges, so it is safe to retry.',
    idempotent: true,
  },
  outputSchema: asanaStoryOutputSchema,
  props: {
    story: Property.ShortText({
      displayName: 'Comment (Story) GID',
      description: 'Gid of the comment story. Obtain it from List Task Stories or Add Task Comment.',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'New plain-text comment; replaces the current text. Cannot be combined with HTML Text.',
      required: false,
    }),
    html_text: Property.LongText({
      displayName: 'HTML Text',
      description: 'New rich-text comment wrapped in <body>...</body>; replaces the current text. Cannot be combined with Text.',
      required: false,
    }),
    is_pinned: asanaProps.optionalBoolean({
      displayName: 'Pinned',
      description: 'Yes pins the comment, No unpins it. Leave empty to keep the current state.',
    }),
  },
  async run(context) {
    const { story, text, html_text, is_pinned } = context.propsValue;
    asanaUtils.assertNotBoth({ first: text, second: html_text, firstLabel: 'Text', secondLabel: 'HTML Text' });
    const data: Record<string, unknown> = {
      ...(asanaUtils.hasValue(text) ? { text } : {}),
      ...(asanaUtils.hasValue(html_text) ? { html_text } : {}),
      ...(is_pinned !== undefined && is_pinned !== null ? { is_pinned } : {}),
    };
    asanaUtils.assertNotEmpty({ patch: data, fields: 'Text, HTML Text or Pinned' });
    return asanaClient.asanaData<AsanaRecord>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/stories/${asanaUtils.pathSegment(story)}`,
      operation: 'Update Comment',
      query: { opt_fields: ASANA_FIELDS.story },
      data,
    });
  },
});
