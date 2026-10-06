import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfWrite } from '../common/hub-write';
import { hfProps } from '../common/props';
import { createRepoBranchOutputSchema } from '../output-schemas';

export const createRepoBranch = createAction({
  auth: huggingFaceAuth,
  name: 'create_repo_branch',
  classification: 'WRITE',
  displayName: 'Create Branch',
  description: 'Create a new branch in a Hub repository.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Creates a new branch in a model, dataset or Space repository, starting from a given branch, tag or commit (the default branch when empty), or as an empty branch. Never overwrites: if the branch already exists the call fails with BRANCH_EXISTS, so a retry after success fails too. Check existing branches with List Branches & Tags; commit to the new branch with Commit Files. Requires a write-role token.",
    idempotent: false,
  },
  outputSchema: createRepoBranchOutputSchema,
  props: {
    repo_type: hfProps.repoType(),
    repo_id: hfProps.repoId(),
    branch: Property.ShortText({
      displayName: 'Branch Name',
      description: "The name of the new branch, for example 'dev' or 'experiment-1'.",
      required: true,
    }),
    starting_point: Property.ShortText({
      displayName: 'Starting Point',
      description:
        "Optional branch, tag or commit SHA the new branch starts from, for example 'main' or 'v1.0'. Leave empty to start from the default branch.",
      required: false,
    }),
    empty_branch: Property.Checkbox({
      displayName: 'Empty Branch',
      description: 'Create the branch with no history and no files instead of copying a starting point.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { repo_type, repo_id, branch, starting_point, empty_branch } = context.propsValue;
    const token = context.auth.secret_text;
    const branchName = hfWrite.stripRefPrefix({
      value: hfWrite.requireText({ value: branch, name: 'Branch Name' }),
      prefix: 'refs/heads/',
    });
    const startingPoint = hfWrite.optionalText({ value: starting_point, name: 'Starting Point' });
    if (empty_branch === true && startingPoint !== undefined) {
      throw new Error('Use either Starting Point or Empty Branch, not both.');
    }
    const repo = await hfWrite.resolveRepo({ token, repoType: repo_type, repoId: repo_id });
    const body: Record<string, unknown> = { overwrite: false };
    if (startingPoint !== undefined) {
      body['startingPoint'] = startingPoint;
    }
    if (empty_branch === true) {
      body['emptyBranch'] = true;
    }
    await hfWrite.request({
      token,
      method: HttpMethod.POST,
      path: `${repo.apiPath}/branch/${encodeURIComponent(branchName)}`,
      body,
      statusErrors: {
        409: (detail) =>
          new Error(
            `BRANCH_EXISTS: branch '${branchName}' already exists in ${repo.repoId}. This action never overwrites a branch; pick another name.${detail ? ` Details: ${detail}` : ''}`
          ),
      },
    });
    return {
      repo_id: repo.repoId,
      repo_type: repo.repoType,
      branch: branchName,
      starting_point: startingPoint ?? null,
      empty_branch: empty_branch === true,
      created: true,
    };
  },
});
