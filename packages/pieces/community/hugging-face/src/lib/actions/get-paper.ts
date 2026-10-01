import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { hfUtils } from '../common/utils';
import { getPaperOutputSchema } from '../output-schemas';

export const getPaper = createAction({
  auth: huggingFaceAuth,
  name: 'get_paper',
  classification: 'READ',
  displayName: 'Get Paper',
  description: 'Get the details of one research paper on Hugging Face.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Returns one research paper on Hugging Face Papers by its arXiv ID: title, authors, summary, publish date, upvotes and linked resources, plus its discussion comments (with comment IDs) when Include Comments is on. Get the ID from Search Papers or List Daily Papers. Read-only and safe to retry.",
    idempotent: true,
  },
  outputSchema: getPaperOutputSchema,
  props: {
    paper_id: Property.ShortText({
      displayName: 'Paper ID',
      description: "The paper's arXiv ID, for example '2307.09288'.",
      required: true,
    }),
    include_comments: Property.Checkbox({
      displayName: 'Include Comments',
      description: 'Also return the comments on the paper page, with their comment IDs.',
      required: false,
      defaultValue: false,
    }),
    include_submission_deadline: Property.Checkbox({
      displayName: 'Include Submission Deadline',
      description: 'Also return the conference submission deadline linked to the paper, when there is one.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { paper_id, include_comments, include_submission_deadline } = context.propsValue;
    const paperId = paper_id.trim();
    if (paperId.length === 0) {
      throw new Error('Paper ID is required.');
    }
    const fields = hfUtils.toStringArray([
      include_comments ? 'comments' : '',
      include_submission_deadline ? 'submissionDeadline' : '',
    ]);
    const response = await hfHub.request<unknown>({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/api/papers/${encodeURIComponent(paperId)}`,
      query: fields.map((field): [string, string] => ['field', field]),
    });
    return response.body;
  },
});
