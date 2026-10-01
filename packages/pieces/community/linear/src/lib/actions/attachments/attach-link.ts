import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { props } from '../../common/props';
import { linearGraphql } from '../../common/graphql';
import { LinearAttachmentNode, linearMappers } from '../../common/mappers';
import { ATTACHMENT_CREATE_MUTATION } from '../../common/queries';
import { attachmentOutputSchema } from '../../output-schemas';

export const linearAttachLink = createAction({
  auth: linearAuth,
  name: 'linear_attach_link',
  classification: 'WRITE',
  displayName: 'Attach Link to Issue',
  description: 'Link a URL (ticket, pull request, document) to an issue. Attaching the same URL again updates the existing link.',
  audience: 'human',
  aiMetadata: {
    description:
      'Attaches an external link (support ticket, pull request, document, dashboard) to a Linear issue, shown in the issue sidebar with a title and optional subtitle. Use to connect records in other tools to an issue; use Create Comment to post text instead. Idempotent: Linear updates the existing attachment when the same URL is attached to the same issue again.',
    idempotent: true,
  },
  props: {
    issue_id: props.issue_reference(),
    url: Property.ShortText({
      displayName: 'URL',
      description: 'The full link, for example https://github.com/acme/app/pull/42.',
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Text shown for the link, for example "PR #42: Fix login timeout".',
      required: true,
    }),
    subtitle: Property.ShortText({
      displayName: 'Subtitle',
      description: 'Optional second line, for example "Open · 2 approvals".',
      required: false,
    }),
  },
  outputSchema: attachmentOutputSchema,
  async run({ auth, propsValue }) {
    const url = propsValue.url.trim();
    if (!/^https?:\/\//i.test(url)) {
      throw new Error('URL must start with http:// or https://.');
    }
    const issueId = await linearGraphql.resolveIssueId({ auth, value: propsValue.issue_id });
    const data = await linearGraphql.request<{
      attachmentCreate: { success: boolean; attachment: LinearAttachmentNode };
    }>({
      auth,
      query: ATTACHMENT_CREATE_MUTATION,
      variables: {
        input: linearGraphql.definedOnly({
          issueId,
          url,
          title: propsValue.title,
          subtitle: propsValue.subtitle,
        }),
      },
    });
    const payload = linearGraphql.requireSuccess({ payload: data.attachmentCreate, what: 'attachment' });
    return linearMappers.flattenAttachment(payload.attachment);
  },
});
