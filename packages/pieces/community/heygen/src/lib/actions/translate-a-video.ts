import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { heygenApiCall } from '../common/client';
import { heygenAuth } from '../common/auth';
import { brandVoiceDropdown, supportedLanguagesDropdown } from '../common/props';

export const translateVideoAction = createAction({
	auth: heygenAuth,
	name: 'translate_video',
	displayName: 'Translate Video',
	description: 'Translate a video into 175+ languages with natural voice and lip-sync.',
	props: {
		videoUrl: Property.ShortText({
			displayName: 'Video URL',
			required: true,
			description:
				'URL of the video file to be translated. Supports direct URLs, Google Drive, and YouTube.',
		}),
		title: Property.ShortText({
			displayName: 'Title',
			required: false,
			description: 'Optional title of the translated video.',
		}),
		outputLanguage: supportedLanguagesDropdown,
		translateAudioOnly: Property.Checkbox({
			displayName: 'Translate Audio Only',
			required: false,
			defaultValue: false,
			description: 'Only translate the audio without modifying faces.',
		}),
		speakerNum: Property.Number({
			displayName: 'Number of Speakers',
			required: false,
			description: 'Number of speakers in the video (if applicable).',
		}),
		brandVoiceId: brandVoiceDropdown,

		callbackId: Property.ShortText({
			displayName: 'Callback ID',
			required: false,
			description: 'Custom ID returned in webhook callback.',
		}),
		callbackUrl: Property.ShortText({
			displayName: 'Callback URL',
			required: false,
			description: 'URL to notify when translation is complete.',
		}),
	},
	async run({ propsValue, auth }) {
		const {
			videoUrl,
			title,
			outputLanguage,
			translateAudioOnly,
			speakerNum,
			callbackId,
			brandVoiceId,
			callbackUrl,
		} = propsValue;

		const body: Record<string, unknown> = {
			video_url: videoUrl,
			output_language: outputLanguage,
		};

		if (title) body['title'] = title;
		if (translateAudioOnly) body['translate_audio_only'] = translateAudioOnly;
		if (speakerNum) body['speaker_num'] = speakerNum;
		if (callbackId) body['callback_id'] = callbackId;
		if (brandVoiceId) body['brand_voice_id'] = brandVoiceId;
		if (callbackUrl) body['callback_url'] = callbackUrl;

		const response = await heygenApiCall({
			apiKey: auth as string,
			method: HttpMethod.POST,
			resourceUri: '/video_translate',
			body,
			apiVersion: 'v2',
		});

		return response;
	},
});
