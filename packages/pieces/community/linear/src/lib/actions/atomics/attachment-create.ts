import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { linearGraphql } from '../../common/graphql';
import { LinearAttachmentNode, linearMappers } from '../../common/mappers';
import { ATTACHMENT_CREATE_MUTATION } from '../../common/queries';
import { atomicAttachmentOutputSchema } from './output-schemas';

export const linearAttachmentCreateAtomic = createAction({
  auth: linearAuth,
  name: 'linear_attachment_create',
  classification: 'WRITE',
  displayName: 'Attach Link to Issue (AI)',
  description: 'Attach a URL to an issue, or update the existing attachment with the same URL.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Attaches an external URL (pull request, support ticket, document) to a Linear issue with a title and optional subtitle, shown in the issue sidebar. Use to link records in other tools to an issue; this does not upload files. Idempotent: attaching the same URL to the same issue again updates the existing attachment instead of adding another.',
    idempotent: true,
  },
  props: {
    issue_id: Property.ShortText({ displayName: 'Issue', description: 'UUID or identifier of the issue, for example ENG-123.', required: true }),
    url: Property.ShortText({ displayName: 'URL', description: 'Full link, for example https://github.com/acme/app/pull/42.', required: true }),
    title: Property.ShortText({ displayName: 'Title', description: 'Text shown for the link, for example "PR #42".', required: true }),
    subtitle: Property.ShortText({ displayName: 'Subtitle', description: 'Optional second line, for example "Merged".', required: false }),
  },
  outputSchema: atomicAttachmentOutputSchema,
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
        input: linearGraphql.definedOnly({ issueId, url, title: propsValue.title, subtitle: propsValue.subtitle }),
      },
    });
    const payload = linearGraphql.requireSuccess({ payload: data.attachmentCreate, what: 'attachment' });
    return linearMappers.flattenAttachment(payload.attachment);
  },
});
