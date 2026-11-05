import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxCreateAutoResponseAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_create_auto_response',
	displayName: 'Create Auto-Response',
	description: 'Adds a keyword auto-response to a messaging profile.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Adds an auto-response to a messaging profile: when a recipient texts one of the keywords, Telnyx applies the start/stop/info behaviour and replies with the response text. Not idempotent: every call creates a new setting.',
		idempotent: false,
	},
	props: {
		messagingProfileId: telnyxAiProps.messagingProfileId({ required: true }),
		op: Property.StaticDropdown({
			displayName: 'Keyword Type',
			description: 'Which opt-in/opt-out keyword group this response applies to.',
			required: true,
			options: {
				disabled: false,
				options: [
					{ label: 'Start (opt-in)', value: 'start' },
					{ label: 'Stop (opt-out)', value: 'stop' },
					{ label: 'Info (help)', value: 'info' },
				],
			},
		}),
		keywords: Property.Array({
			displayName: 'Keywords',
			description: 'Keywords that trigger the response, e.g. ["STOP","UNSUBSCRIBE"].',
			required: true,
		}),
		countryCode: Property.ShortText({
			displayName: 'Country Code',
			description: 'ISO 3166-1 alpha-2 country the setting applies to, e.g. "US".',
			required: true,
		}),
		respText: Property.LongText({
			displayName: 'Response Text',
			description: 'Text sent back when a keyword is received.',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.createAutoResponse({
			auth: context.auth,
			messagingProfileId: p.messagingProfileId,
			body: telnyxUtils.compact({
				values: {
					op: p.op,
					keywords: p.keywords,
					country_code: p.countryCode,
					resp_text: p.respText,
				},
			}),
		});
	},
});
