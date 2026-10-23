import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxListMobileNetworkOperatorsAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_list_mobile_network_operators',
	displayName: 'List Mobile Network Operators',
	description: 'Lists mobile network operators for SIM connectivity.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of mobile network operators available to Telnyx SIM cards (name, country, MCC/MNC, TADIG). Filter by name, country or codes.',
		idempotent: true,
	},
	props: {
		nameContains: Property.ShortText({
			displayName: 'Name Contains',
			description: 'Only operators whose name contains this text.',
			required: false,
		}),
		countryCode: Property.ShortText({
			displayName: 'Country Code',
			description: 'Only operators in this ISO country code, e.g. "US".',
			required: false,
		}),
		mcc: Property.ShortText({
			displayName: 'MCC',
			description: 'Only operators with this mobile country code.',
			required: false,
		}),
		mnc: Property.ShortText({
			displayName: 'MNC',
			description: 'Only operators with this mobile network code.',
			required: false,
		}),
		tadig: Property.ShortText({
			displayName: 'TADIG',
			description: 'Only the operator with this TADIG code.',
			required: false,
		}),
		pageNumber: telnyxAiProps.pageNumber({ required: false }),
		pageSize: telnyxAiProps.pageSize({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.listMobileNetworkOperators({
			auth: context.auth,
			query: {
				...telnyxUtils.toQuery({ values: { 'filter[name][contains]': p.nameContains } }),
				...telnyxUtils.filterQuery({
					filters: { country_code: p.countryCode, mcc: p.mcc, mnc: p.mnc, tadig: p.tadig },
				}),
				...telnyxUtils.pageQuery({ pageNumber: p.pageNumber, pageSize: p.pageSize }),
			},
		});
	},
});
