import { captionImageAction } from './caption-image';
import { createImageMaskAction } from './create-image-mask';
import { deleteMediaAction } from './delete-media';
import { enhancePromptAction } from './enhance-prompt';
import { generate3dAction } from './generate-3d';
import { generateAudioAction } from './generate-audio';
import { generateImageAction } from './generate-image';
import { generateTextAction } from './generate-text';
import { generateVideoAction } from './generate-video';
import { getAccountAction } from './get-account';
import { getTaskDetailsAction } from './get-task-details';
import { getTaskResultAction } from './get-task-result';
import { getUsageActivityAction } from './get-usage-activity';
import { getUsageErrorsAction } from './get-usage-errors';
import { getUsagePerformanceAction } from './get-usage-performance';
import { preprocessControlnetImageAction } from './preprocess-controlnet-image';
import { removeBackgroundAction } from './remove-background';
import { searchModelsAction } from './search-models';
import { uploadMediaAction } from './upload-media';
import { upscaleAction } from './upscale';
import { vectorizeImageAction } from './vectorize-image';

export const runwareAiActions = [
	generateImageAction,
	generateVideoAction,
	generateAudioAction,
	generateTextAction,
	generate3dAction,
	getTaskResultAction,
	removeBackgroundAction,
	upscaleAction,
	captionImageAction,
	vectorizeImageAction,
	enhancePromptAction,
	createImageMaskAction,
	preprocessControlnetImageAction,
	searchModelsAction,
	uploadMediaAction,
	deleteMediaAction,
	getTaskDetailsAction,
	getAccountAction,
	getUsageActivityAction,
	getUsagePerformanceAction,
	getUsageErrorsAction,
];
