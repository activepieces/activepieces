import { amazonS3CopyFile } from './copy-file';
import { amazonS3DeleteFileTags } from './delete-file-tags';
import { amazonS3DeleteFiles } from './delete-files';
import { amazonS3GetFileMetadata } from './get-file-metadata';
import { amazonS3GetFileTags } from './get-file-tags';
import { amazonS3ListFileVersions } from './list-file-versions';
import { amazonS3ListFilesAi } from './list-files';
import { amazonS3MoveFileAi } from './move-file';
import { amazonS3ReadFileAi } from './read-file';
import { amazonS3SetFileTags } from './set-file-tags';
import { amazonS3UploadFileAi } from './upload-file';

export const amazonS3AiActions = [
	amazonS3ListFilesAi,
	amazonS3GetFileMetadata,
	amazonS3ReadFileAi,
	amazonS3UploadFileAi,
	amazonS3CopyFile,
	amazonS3MoveFileAi,
	amazonS3DeleteFiles,
	amazonS3GetFileTags,
	amazonS3SetFileTags,
	amazonS3DeleteFileTags,
	amazonS3ListFileVersions,
];
