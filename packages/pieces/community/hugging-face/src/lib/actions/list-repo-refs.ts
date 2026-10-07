import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { hfProps } from '../common/props';
import { hfRepo } from '../common/repo';
import { listRepoRefsOutputSchema } from '../output-schemas';

export const listRepoRefs = createAction({
  auth: huggingFaceAuth,
  name: 'list_repo_refs',
  classification: 'SEARCH',
  displayName: 'List Branches & Tags',
  description: 'List the branches, tags and converted refs of a Hub repository.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Lists every git ref of a Hub repository: branches, tags, converted refs (such as 'refs/convert/parquet') and, optionally, pull-request refs ('refs/pr/N'), each with its target commit. Use it to find a valid revision before reading files, listing commits or comparing revisions. Read-only and safe to retry.",
    idempotent: true,
  },
  outputSchema: listRepoRefsOutputSchema,
  props: {
    repo_type: hfProps.repoType(),
    repo_id: hfProps.repoId(),
    include_prs: Property.Checkbox({
      displayName: 'Include Pull Request Refs',
      description: "Also list the 'refs/pr/N' refs of open and closed pull requests.",
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { repo_type, repo_id, include_prs } = context.propsValue;
    const token = context.auth.secret_text;
    const apiPath = await hfRepo.apiPath({ token, repoType: repo_type, repoId: repo_id });
    const response = await hfHub.request<unknown>({
      token,
      method: HttpMethod.GET,
      path: `${apiPath}/refs`,
      query: [['include_prs', include_prs ? '1' : undefined]],
    });
    return response.body;
  },
});
