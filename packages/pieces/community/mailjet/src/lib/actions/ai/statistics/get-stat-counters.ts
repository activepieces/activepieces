import { createAction, Property } from '@activepieces/pieces-framework';

import { mailjetStatCountersOutputSchema } from './output-schemas';
import { mailjetAuth } from '../../../auth';
import { mailjetAiProps } from '../../../common/ai-props';
import { mailjetApi } from '../../../common/api';
import { mailjetUtils } from '../../../common/utils';

export const mailjetGetStatCountersAction = createAction({
	auth: mailjetAuth,
	name: 'mailjet_get_stat_counters',
	outputSchema: mailjetStatCountersOutputSchema,
	displayName: 'Get Statistics',
	description: 'Gets delivery and engagement counters.',
	audience: 'ai',
	classification: 'SEARCH',
	aiMetadata: {
		description:
			'Gets sent, delivered, opened, clicked, bounced and other counters for the API key, a campaign, a list or a sender, over the lifetime or per day/hour. List stats need Message timing and Lifetime resolution; sender stats need Message timing.',
		idempotent: true,
	},
	props: {
		counterSource: Property.StaticDropdown({
			displayName: 'Source',
			description: 'What to count for: APIKey (whole account), Campaign, List or Sender.',
			required: true,
			options: {
				options: [
					{ label: 'APIKey', value: 'APIKey' },
					{ label: 'Campaign', value: 'Campaign' },
					{ label: 'List', value: 'List' },
					{ label: 'Sender', value: 'Sender' },
				],
			},
		}),
		counterTiming: Property.StaticDropdown({
			displayName: 'Timing',
			description: 'Message counts by send time, Event by event time.',
			required: true,
			options: {
				options: [
					{ label: 'Message', value: 'Message' },
					{ label: 'Event', value: 'Event' },
				],
			},
		}),
		counterResolution: Property.StaticDropdown({
			displayName: 'Resolution',
			description: 'Lifetime for one total, Day or Hour for a time series.',
			required: true,
			options: {
				options: [
					{ label: 'Lifetime', value: 'Lifetime' },
					{ label: 'Day', value: 'Day' },
					{ label: 'Hour', value: 'Hour' },
				],
			},
		}),
		sourceId: Property.Number({
			displayName: 'Source ID',
			description: 'ID of the campaign, list or sender; not used for APIKey.',
			required: false,
		}),
		fromTs: Property.ShortText({
			displayName: 'From',
			description: 'Start of the period, RFC 3339 or Unix timestamp.',
			required: false,
		}),
		toTs: Property.ShortText({
			displayName: 'To',
			description: 'End of the period, RFC 3339 or Unix timestamp.',
			required: false,
		}),
		...mailjetAiProps.paging,
	},
	async run(context) {
		const p = context.propsValue;
		return await mailjetApi.get({
			auth: context.auth,
			path: '/v3/REST/statcounters',
			query: {
				CounterSource: p.counterSource,
				CounterTiming: p.counterTiming,
				CounterResolution: p.counterResolution,
				SourceID: p.sourceId,
				FromTS: p.fromTs,
				ToTS: p.toTs,
				...mailjetUtils.pagingQuery(p),
			},
		});
	},
});
