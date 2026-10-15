import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfWrite } from '../common/hub-write';
import { hfProps } from '../common/props';
import { deleteRepoTagOutputSchema } from '../output-schemas';

export const deleteRepoTag = createAction({
  auth: huggingFaceAuth,
  name: 'delete_repo_tag',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Tag',
  description: 'Delete a git tag from a Hub repository.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Permanently deletes a git tag from a model, dataset or Space repository; the tagged commits stay, but anything pinned to that tag loses it. Confirm the exact tag with List Branches & Tags and only delete tags the user asked to remove. A retry after success fails because the tag is gone. Requires a write-role token.",
    idempotent: false,
  },
  outputSchema: deleteRepoTagOutputSchema,
  props: {
    repo_type: hfProps.repoType(),
    repo_id: hfProps.repoId(),
    tag: Property.ShortText({
      displayName: 'Tag Name',
      description: "The tag to delete, for example 'v1.0'.",
      required: true,
    }),
  },
  async run(context) {
    const { repo_type, repo_id, tag } = context.propsValue;
    const token = context.auth.secret_text;
    const tagName = hfWrite.stripRefPrefix({
      value: hfWrite.requireText({ value: tag, name: 'Tag Name' }),
      prefix: 'refs/tags/',
    });
    const repo = await hfWrite.resolveRepo({ token, repoType: repo_type, repoId: repo_id });
    await hfWrite.request({
      token,
      method: HttpMethod.DELETE,
      path: `${repo.apiPath}/tag/${encodeURIComponent(tagName)}`,
    });
    return {
      repo_id: repo.repoId,
      repo_type: repo.repoType,
      tag: tagName,
      deleted: true,
    };
  },
});
