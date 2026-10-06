import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { hfProps } from '../common/props';
import { hfRepo } from '../common/repo';
import { hfUtils } from '../common/utils';
import { compareRepoRevisionsOutputSchema } from '../output-schemas';

const MAX_DIFF_CHARS = 100000;

export const compareRepoRevisions = createAction({
  auth: huggingFaceAuth,
  name: 'compare_repo_revisions',
  classification: 'READ',
  displayName: 'Compare Revisions',
  description: 'Get the git diff between two revisions of a Hub repository.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Returns the raw git diff between two revisions (branches, tags or commit ids) of a Hub repository, for example to see what a pull request ref changes against main. The diff is cut at 100000 characters and truncated is set when that happens; large binary or LFS changes appear only as pointer changes. Read-only and safe to retry.",
    idempotent: true,
  },
  outputSchema: compareRepoRevisionsOutputSchema,
  props: {
    repo_type: hfProps.repoType(),
    repo_id: hfProps.repoId(),
    base: Property.ShortText({
      displayName: 'Base Revision',
      description: "The older revision, for example 'main', 'v1.0' or a commit id.",
      required: true,
    }),
    head: Property.ShortText({
      displayName: 'Head Revision',
      description: "The newer revision, for example 'refs/pr/1' or a commit id.",
      required: true,
    }),
  },
  async run(context) {
    const { repo_type, repo_id, base, head } = context.propsValue;
    const token = context.auth.secret_text;
    const apiPath = await hfRepo.apiPath({ token, repoType: repo_type, repoId: repo_id });
    const response = await hfHub.request<unknown>({
      token,
      method: HttpMethod.GET,
      path: `${apiPath}/compare/${hfRepo.encodeRevision(base)}..${hfRepo.encodeRevision(head)}`,
    });
    const raw = typeof response.body === 'string' ? response.body : JSON.stringify(response.body ?? '');
    const diff = hfUtils.truncateText({ text: raw, maxChars: MAX_DIFF_CHARS });
    return {
      base,
      head,
      diff: diff.text,
      truncated: diff.truncated,
      diff_length: diff.originalLength,
    };
  },
});
