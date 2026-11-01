import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { hfWrite } from '../common/hub-write';
import { hfProps } from '../common/props';
import { renameDiscussionOutputSchema } from '../output-schemas';

export const renameDiscussion = createAction({
  auth: huggingFaceAuth,
  name: 'rename_discussion',
  classification: 'WRITE',
  displayName: 'Rename Discussion',
  description: 'Change the title of a discussion or pull request of a Hub repository.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Changes the title of an existing discussion or pull request of a model, dataset or Space repository; the change is shown publicly in the thread. Re-applying the same title converges, so it is safe to retry. Requires a write-role token and being the thread author or having write access to the repository.",
    idempotent: true,
  },
  outputSchema: renameDiscussionOutputSchema,
  props: {
    repo_type: hfProps.repoType(),
    repo_id: hfProps.repoId(),
    discussion_number: Property.Number({
      displayName: 'Discussion Number',
      description: "The discussion or pull request number within the repository (the 'num' from List Discussions & PRs).",
      required: true,
    }),
    title: Property.ShortText({
      displayName: 'New Title',
      description: 'The new title, 3 to 200 characters.',
      required: true,
    }),
  },
  async run(context) {
    const { repo_type, repo_id, discussion_number, title } = context.propsValue;
    const token = context.auth.secret_text;
    const num = hfWrite.assertDiscussionNumber(discussion_number);
    const newTitle = hfWrite.requireText({ value: title, name: 'New Title', maxLength: 200 });
    if (newTitle.length < 3) {
      throw new Error('New Title must be at least 3 characters.');
    }
    const repo = await hfWrite.resolveRepo({ token, repoType: repo_type, repoId: repo_id });
    const response = await hfWrite.request({
      token,
      method: HttpMethod.POST,
      path: `${repo.apiPath}/discussions/${num}/title`,
      body: { title: newTitle },
    });
    const event = hfHub.isRecord(response) ? response['newTitle'] : undefined;
    const data = hfHub.isRecord(event) ? event['data'] : undefined;
    return {
      repo_id: repo.repoId,
      repo_type: repo.repoType,
      discussion_number: num,
      title: hfWrite.readString({ record: data, key: 'to' }) ?? newTitle,
      previous_title: hfWrite.readString({ record: data, key: 'from' }),
      event_id: hfWrite.readString({ record: event, key: 'id' }),
    };
  },
});
