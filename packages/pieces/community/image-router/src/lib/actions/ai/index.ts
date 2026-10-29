import { createChatCompletionAction } from './create-chat-completion';
import { createResponseAction } from './create-response';
import { editImageAction } from './edit-image';
import { generateImageAction } from './generate-image';
import { generateVideoAction } from './generate-video';
import { getCreditsAction } from './get-credits';
import { getModelAction } from './get-model';
import { listModelsAction } from './list-models';

export const imageRouterAiActions = [
	generateImageAction,
	editImageAction,
	generateVideoAction,
	createChatCompletionAction,
	createResponseAction,
	listModelsAction,
	getModelAction,
	getCreditsAction,
];
