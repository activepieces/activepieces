import { createAction, Property } from '@activepieces/pieces-framework';

import { telnyxAuth } from '../../../auth';
import { telnyxAiProps } from '../../../common/ai-props';
import { telnyxApi } from '../../../common/api';
import { telnyxUtils } from '../../../common/utils';

export const telnyxListRecordingsAction = createAction({
	auth: telnyxAuth,
	name: 'telnyx_list_recordings',
	displayName: 'List Recordings',
	description: 'Lists call and conference recordings.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Lists one page of call and conference recordings with their id, status, duration and download URLs. Filter by call, conference, numbers or creation time. Recordings come from Start Call Recording and Start Conference Recording.',
		idempotent: true,
	},
	props: {
		callControlId: telnyxAiProps.callControlId({
			required: false,
			displayName: 'Call Control ID',
			description: 'Only return recordings of this call.',
		}),
		conferenceId: Property.ShortText({
			displayName: 'Conference ID',
			description: 'Only return recordings of this conference.',
			required: false,
		}),
		from: Property.ShortText({
			displayName: 'From',
			description: 'Only return recordings whose caller number matches exactly.',
			required: false,
		}),
		to: Property.ShortText({
			displayName: 'To',
			description: 'Only return recordings whose called number matches exactly.',
			required: false,
		}),
		createdAfter: Property.DateTime({
			displayName: 'Created After',
			description: 'Only return recordings created at or after this time.',
			required: false,
		}),
		createdBefore: Property.DateTime({
			displayName: 'Created Before',
			description: 'Only return recordings created at or before this time.',
			required: false,
		}),
		pageNumber: telnyxAiProps.pageNumber({ required: false }),
		pageSize: telnyxAiProps.pageSize({ required: false }),
	},
	async run(context) {
		const p = context.propsValue;
		return await telnyxApi.listRecordings({
			auth: context.auth,
			query: {
				...telnyxUtils.filterQuery({
					filters: {
						call_control_id: p.callControlId,
						conference_id: p.conferenceId,
						from: p.from,
						to: p.to,
					},
				}),
				...telnyxUtils.toQuery({
					values: {
						'filter[created_at][gte]': p.createdAfter,
						'filter[created_at][lte]': p.createdBefore,
					},
				}),
				...telnyxUtils.pageQuery({ pageNumber: p.pageNumber, pageSize: p.pageSize }),
			},
		});
	},
});
