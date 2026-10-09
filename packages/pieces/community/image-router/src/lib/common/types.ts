import type { ApFile, AppConnectionType } from '@activepieces/pieces-framework';

export type ImageRouterAuthValue = {
	type: AppConnectionType.SECRET_TEXT;
	secret_text: string;
};

export type ImageRouterImageResponse = {
	data?: Array<{
		url?: string;
		b64_json?: string;
		revised_prompt?: string;
	}>;
};

export type ImageRouterModels = Record<
	string,
	{
		providers?: Array<{
			id?: string;
			name?: string;
			pricing?: { type?: string; value?: number };
		}>;
	}
>;

export type ImageRouterImageOptions = {
	prompt: string;
	model: string;
	quality?: string;
	size?: string;
	responseFormat?: string;
};

export type ImageRouterEditImageOptions = ImageRouterImageOptions & {
	images: ApFile[];
	masks: ApFile[];
};
