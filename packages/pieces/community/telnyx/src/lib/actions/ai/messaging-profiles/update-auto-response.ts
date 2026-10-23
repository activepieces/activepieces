import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxUpdateAutoResponseAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_update_auto_response',
	displayName: 'Update Auto-Response',
	description: 'Updates a keyword auto-response, keeping every field you leave empty.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Updates an auto-response setting. Reads the current setting first and sends it back with only the fields you set changed, since the API replaces the whole setting. Keywords replaces the full list.',
		idempotent: true,
	},
	props: {
		messagingProfileId: telnyxAiProps.messagingProfileId({ required: true }),
		autoResponseId: Property.ShortText({
			displayName: 'Auto-Response ID',
			description: 'Auto-response setting ID. Use List Auto-Responses to find it.',
			required: true,
		}),
		op: Property.StaticDropdown({
			displayName: 'Keyword Type',
			description: 'Which opt-in/opt-out keyword group this response applies to.',
			required: false,
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
			description: 'Replaces the full keyword list, e.g. ["STOP","END"].',
			required: false,
		}),
		countryCode: Property.ShortText({
			displayName: 'Country Code',
			description: 'ISO 3166-1 alpha-2 country, e.g. "US".',
			required: false,
		}),
		respText: Property.LongText({
			displayName: 'Response Text',
			description: 'Text sent back when a keyword is received.',
			required: false,
		}),
	},
	async run(context) {
		const p = context.propsValue;
		const current = await telnyxApi.getAutoResponse({
			auth: context.auth,
			messagingProfileId: p.messagingProfileId,
			autoResponseId: p.autoResponseId,
		});
		return await telnyxApi.updateAutoResponse({
			auth: context.auth,
			messagingProfileId: p.messagingProfileId,
			autoResponseId: p.autoResponseId,
			body: telnyxUtils.compact({
				values: {
					op: p.op ?? current?.['op'],
					keywords: p.keywords ?? current?.['keywords'],
					country_code: p.countryCode ?? current?.['country_code'],
					resp_text: p.respText ?? current?.['resp_text'],
				},
			}),
		});
	},
});
