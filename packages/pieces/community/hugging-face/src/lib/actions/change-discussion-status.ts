import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { hfWrite } from '../common/hub-write';
import { hfProps } from '../common/props';
import { changeDiscussionStatusOutputSchema } from '../output-schemas';

export const changeDiscussionStatus = createAction({
  auth: huggingFaceAuth,
  name: 'change_discussion_status',
  classification: 'WRITE',
  displayName: 'Open or Close Discussion',
  description: 'Close or reopen a discussion or pull request of a Hub repository.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Closes or reopens a discussion or pull request of a model, dataset or Space repository, optionally with a public closing comment. Closing is the reversible alternative to Delete Discussion, so prefer it. Every call records a new status event and re-posts the comment, so avoid blind retries. Requires a write-role token and being the thread author or having write access to the repository.",
    idempotent: false,
  },
  outputSchema: changeDiscussionStatusOutputSchema,
  props: {
    repo_type: hfProps.repoType(),
    repo_id: hfProps.repoId(),
    discussion_number: Property.Number({
      displayName: 'Discussion Number',
      description: "The discussion or pull request number within the repository (the 'num' from List Discussions & PRs).",
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'The new status: Closed or Open (reopen).',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Closed', value: 'closed' },
          { label: 'Open', value: 'open' },
        ],
      },
    }),
    comment: Property.LongText({
      displayName: 'Comment',
      description: 'Optional public comment posted with the status change, for example the reason for closing.',
      required: false,
    }),
  },
  async run(context) {
    const { repo_type, repo_id, discussion_number, status, comment } = context.propsValue;
    const token = context.auth.secret_text;
    const num = hfWrite.assertDiscussionNumber(discussion_number);
    if (status !== 'open' && status !== 'closed') {
      throw new Error("Status must be 'open' or 'closed'.");
    }
    const text = hfWrite.optionalText({ value: comment, name: 'Comment', maxLength: 65536 });
    const repo = await hfWrite.resolveRepo({ token, repoType: repo_type, repoId: repo_id });
    const body: Record<string, unknown> = { status };
    if (text !== undefined) {
      body['comment'] = text;
    }
    const response = await hfWrite.request({
      token,
      method: HttpMethod.POST,
      path: `${repo.apiPath}/discussions/${num}/status`,
      body,
    });
    const event = hfHub.isRecord(response) ? response['newStatus'] : undefined;
    const data = hfHub.isRecord(event) ? event['data'] : undefined;
    return {
      repo_id: repo.repoId,
      repo_type: repo.repoType,
      discussion_number: num,
      status: hfWrite.readString({ record: data, key: 'status' }) ?? status,
      event_id: hfWrite.readString({ record: event, key: 'id' }),
      created_at: hfWrite.readString({ record: event, key: 'createdAt' }),
    };
  },
});
