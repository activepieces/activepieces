import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfWrite } from '../common/hub-write';
import { hfProps } from '../common/props';
import { hfRepo } from '../common/repo';
import { createRepoTagOutputSchema } from '../output-schemas';

export const createRepoTag = createAction({
  auth: huggingFaceAuth,
  name: 'create_repo_tag',
  classification: 'WRITE',
  displayName: 'Create Tag',
  description: 'Create a git tag on a revision of a Hub repository.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Creates a git tag (for example a release like 'v1.0') pointing at a branch, tag or commit of a model, dataset or Space repository. Fails with TAG_EXISTS if the tag is already there, so a retry after success fails too; check existing tags with List Branches & Tags. Requires a write-role token.",
    idempotent: false,
  },
  outputSchema: createRepoTagOutputSchema,
  props: {
    repo_type: hfProps.repoType(),
    repo_id: hfProps.repoId(),
    tag: Property.ShortText({
      displayName: 'Tag Name',
      description: "The tag to create, for example 'v1.0'.",
      required: true,
    }),
    revision: Property.ShortText({
      displayName: 'Revision',
      description: "The branch, tag or commit SHA to tag, for example 'main', 'dev' or a commit SHA. Get branch names from List Branches & Tags and commit SHAs from List Repo Commits.",
      required: true,
    }),
    message: Property.LongText({
      displayName: 'Message',
      description: 'Optional annotation message stored with the tag.',
      required: false,
    }),
  },
  async run(context) {
    const { repo_type, repo_id, tag, revision, message } = context.propsValue;
    const token = context.auth.secret_text;
    const tagName = hfWrite.stripRefPrefix({
      value: hfWrite.requireText({ value: tag, name: 'Tag Name' }),
      prefix: 'refs/tags/',
    });
    const tagMessage = hfWrite.optionalText({ value: message, name: 'Message' });
    const targetRevision = hfWrite.requireText({ value: revision, name: 'Revision' });
    const repo = await hfWrite.resolveRepo({ token, repoType: repo_type, repoId: repo_id });
    const body: Record<string, unknown> = { tag: tagName };
    if (tagMessage !== undefined) {
      body['message'] = tagMessage;
    }
    await hfWrite.request({
      token,
      method: HttpMethod.POST,
      path: `${repo.apiPath}/tag/${hfRepo.encodeRevision(targetRevision)}`,
      body,
      statusErrors: {
        409: (detail) =>
          new Error(
            `TAG_EXISTS: tag '${tagName}' already exists in ${repo.repoId}. Pick another name or delete the old tag first.${detail ? ` Details: ${detail}` : ''}`
          ),
      },
    });
    return {
      repo_id: repo.repoId,
      repo_type: repo.repoType,
      tag: tagName,
      revision: targetRevision,
      created: true,
    };
  },
});
