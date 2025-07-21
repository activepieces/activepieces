import {
	AuthenticationType,
	DedupeStrategy,
	httpClient,
	HttpMethod,
	Polling,
	pollingHelper,
	QueryParams,
} from '@activepieces/pieces-common';
import {
	PiecePropValueSchema,
	StaticPropsValue,
	TriggerStrategy,
	createTrigger,
} from '@activepieces/pieces-framework';
import { BASE_URL } from '../common/client';
import { NinoxAuth } from '../common/auth';
import { teamidDropdown, databaseIdDropdown, tableIdDropdown } from '../common/props';

const props = {
	teamid: teamidDropdown,
	dbid: databaseIdDropdown,
	tid: tableIdDropdown,
};

const polling: Polling<PiecePropValueSchema<typeof NinoxAuth>, StaticPropsValue<typeof props>> = {
	strategy: DedupeStrategy.LAST_ITEM,
	async items({ auth, propsValue, lastItemId }) {
		const { teamid, dbid, tid } = propsValue;

		const isTest = lastItemId === null;

        const qs:QueryParams = { new: 'true', perPage: isTest ? '10' : '100', page: '0'}

        if(lastItemId) qs['sinceId'] = String(lastItemId)

		const response = await httpClient.sendRequest<Array<{ id: number }>>({
			method: HttpMethod.GET,
			url: BASE_URL + `/teams/${teamid}/databases/${dbid}/tables/${tid}/records`,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: auth,
			},
			queryParams: qs,
		});

		return response.body.map((record) => ({
			id: record.id,
			data: record,
		}));
	},
};

export const newRecord = createTrigger({
	auth: NinoxAuth,
	name: 'newRecord',
	displayName: 'New Record',
	description: 'Triggers when a new record is created in a table.',
	props,
	sampleData: {
		id: 10,
		sequence: 45,
		createdAt: '2025-07-18T11:19:58',
		createdBy: 'BwqY7B4K9KidHBuEs',
		modifiedAt: '2025-07-18T11:20:01',
		modifiedBy: 'BwqY7B4K9KidHBuEs',
		fields: {
			'text-field': 'test',
			'Rich text': '',
			Location: '',
		},
	},
	type: TriggerStrategy.POLLING,
	async onEnable(context) {
		await pollingHelper.onEnable(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue,
		});
	},
	async onDisable(context) {
		await pollingHelper.onDisable(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue,
		});
	},
	async test(context) {
		return await pollingHelper.test(polling, context);
	},
	async run(context) {
		return await pollingHelper.poll(polling, context);
	},
});
