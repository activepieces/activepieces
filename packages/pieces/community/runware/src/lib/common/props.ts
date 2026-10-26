import { Property } from '@activepieces/pieces-framework';

function model<R extends boolean>({
	required,
	displayName = 'Model',
	description = `You can find model in the Model Explorer (https://my.runware.ai/models/all) tool.`,
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function positivePrompt<R extends boolean>({
	required,
	displayName = 'Positive Prompt',
	description = 'A positive prompt is a text instruction to guide the model on generating the image. It is usually a sentence or a paragraph that provides positive guidance for the task. This parameter is essential to shape the desired results.',
}: PropParams<R>) {
	return Property.LongText({ displayName, description, required });
}

function negativePrompt<R extends boolean>({
	required,
	displayName = 'Negative Prompt',
	description = 'A negative prompt is a text instruction to guide the model on generating the image. It is usually a sentence or a paragraph that provides negative guidance for the task. This parameter helps to avoid certain undesired results.',
}: PropParams<R>) {
	return Property.LongText({ displayName, description, required });
}

function height<R extends boolean>({
	required,
	displayName = 'Height',
	description = 'Used to define the height dimension of the generated image. Certain models perform better with specific dimensions.',
}: PropParams<R>) {
	return Property.Number({ displayName, description, required });
}

function width<R extends boolean>({
	required,
	displayName = 'Width',
	description = 'Used to define the width dimension of the generated image. Certain models perform better with specific dimensions.',
}: PropParams<R>) {
	return Property.Number({ displayName, description, required });
}

function steps<R extends boolean>({
	required,
	displayName = 'Steps',
	description = 'The number of steps is the number of iterations the model will perform to generate the image. The higher the number of steps, the more detailed the image will be. However, increasing the number of steps will also increase the time it takes to generate the image and may not always result in a better image (some schedulers work differently).',
}: PropParams<R>) {
	return Property.Number({ displayName, description, required });
}

function CFGScale<R extends boolean>({
	required,
	displayName = 'CFG Scale',
	description = 'Guidance scale represents how closely the images will resemble the prompt or how much freedom the AI model has. Higher values are closer to the prompt. Low values may reduce the quality of the results.',
}: PropParams<R>) {
	return Property.Number({ displayName, description, required });
}

function scheduler<R extends boolean>({
	required,
	displayName = 'Scheduler',
	description = 'An scheduler is a component that manages the inference process. Different schedulers can be used to achieve different results like more detailed images, faster inference, or more accurate results.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

function uploadEndpoint<R extends boolean>({
	required,
	displayName = 'Upload Endpoint',
	description = 'Specifies a URL where the generated content will be automatically uploaded using the HTTP PUT method. The raw binary data of the media file is sent directly as the request body. For secure uploads to cloud storage, use presigned URLs that include temporary authentication credentials.',
}: PropParams<R>) {
	return Property.ShortText({ displayName, description, required });
}

export const runwareProps = {
	model,
	positivePrompt,
	negativePrompt,
	height,
	width,
	steps,
	CFGScale,
	scheduler,
	uploadEndpoint,
};

export type PropParams<R extends boolean> = {
	required: R;
	displayName?: string;
	description?: string;
};
