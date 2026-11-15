import { createAction, Property } from '@activepieces/pieces-framework';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { hfProps } from '../common/props';
import { hfRepo } from '../common/repo';
import { readRepoFileOutputSchema } from '../output-schemas';

export const readRepoFile = createAction({
  auth: huggingFaceAuth,
  name: 'read_repo_file',
  classification: 'READ',
  displayName: 'Read Repo File',
  description: 'Read a text file (such as README.md or config.json) from a Hub repository.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Downloads one UTF-8 text file from a model, dataset or Space repository at a revision and returns its content, for example README.md, config.json or a training script. Files over 1 MiB or binary files (weights, images, parquet) fail with FILE_TOO_LARGE or BINARY_FILE and the download URL instead; check sizes first with Get File/Folder Info. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: readRepoFileOutputSchema,
  props: {
    repo_type: hfProps.repoType(),
    repo_id: hfProps.repoId(),
    path: Property.ShortText({
      displayName: 'File Path',
      description: "Path of the file inside the repository, for example 'README.md' or 'configs/config.json'.",
      required: true,
    }),
    revision: hfProps.revision(),
  },
  async run(context) {
    const { repo_type, repo_id, path, revision } = context.propsValue;
    const encodedPath = hfRepo.encodeFilePath(path);
    if (!encodedPath) {
      throw new Error('File Path is required.');
    }
    const token = context.auth.secret_text;
    const { resolvePrefix } = hfRepo.getTypeInfo(repo_type);
    const canonicalId = await hfRepo.resolveRepoId({ token, repoType: repo_type, repoId: repo_id });
    const resolvedRevision = revision?.trim() || 'main';
    const url = `${hfHub.baseUrl}/${resolvePrefix}${hfRepo.encodeRepoId(canonicalId)}/resolve/${hfRepo.encodeRevision(resolvedRevision)}/${encodedPath}`;
    const file = await hfHub.readRepoFileText({ token, url });
    return {
      repo_type,
      repo_id: canonicalId,
      revision: resolvedRevision,
      path,
      content: file.content,
      size_bytes: file.sizeBytes,
      url,
    };
  },
});
