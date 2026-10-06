import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfWrite } from '../common/hub-write';
import { hfProps } from '../common/props';
import { deleteRepoBranchOutputSchema } from '../output-schemas';

export const deleteRepoBranch = createAction({
  auth: huggingFaceAuth,
  name: 'delete_repo_branch',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Branch',
  description: 'Delete a branch from a Hub repository.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Permanently deletes a branch from a model, dataset or Space repository ('main' is always refused); commits reachable only from that branch are lost. Confirm the exact branch with List Branches & Tags first and only delete branches the user asked to remove. A retry after success fails because the branch is gone. Requires a write-role token.",
    idempotent: false,
  },
  outputSchema: deleteRepoBranchOutputSchema,
  props: {
    repo_type: hfProps.repoType(),
    repo_id: hfProps.repoId(),
    branch: Property.ShortText({
      displayName: 'Branch Name',
      description: "The branch to delete, for example 'dev'. The 'main' branch cannot be deleted with this action.",
      required: true,
    }),
  },
  async run(context) {
    const { repo_type, repo_id, branch } = context.propsValue;
    const token = context.auth.secret_text;
    const branchName = hfWrite.stripRefPrefix({
      value: hfWrite.requireText({ value: branch, name: 'Branch Name' }),
      prefix: 'refs/heads/',
    });
    if (branchName.toLowerCase() === 'main') {
      throw new Error("PROTECTED_BRANCH: the 'main' branch cannot be deleted with this action.");
    }
    const repo = await hfWrite.resolveRepo({ token, repoType: repo_type, repoId: repo_id });
    await hfWrite.request({
      token,
      method: HttpMethod.DELETE,
      path: `${repo.apiPath}/branch/${encodeURIComponent(branchName)}`,
    });
    return {
      repo_id: repo.repoId,
      repo_type: repo.repoType,
      branch: branchName,
      deleted: true,
    };
  },
});
