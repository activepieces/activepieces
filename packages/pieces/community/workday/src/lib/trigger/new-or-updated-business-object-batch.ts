import {
	DedupeStrategy,
	HttpMethod,
	Polling,
	QueryParams,
	pollingHelper,
} from '@activepieces/pieces-common';
import {
	AppConnectionValueForAuthProperty,
	Property,
	StaticPropsValue,
	TriggerStrategy,
	createTrigger,
} from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import { workdayAuth } from '../auth';
import { fetchAllPages, workdayRequest } from '../common';
import { formatWorkdayOutputs, getRecordTimestamp } from '../common/fields';
import { resolveBusinessObject, toWorkdayModule } from '../common/modules';
import { dateFieldProperty, sharedModuleProps } from '../common/props';

const props = {
	...sharedModuleProps,
	dateField: dateFieldProperty,
	additionalFilters: Property.Json({
		displayName: 'Additional Filters (JSON)',
		required: false,
	}),
};

const polling: Polling<
	AppConnectionValueForAuthProperty<typeof workdayAuth>,
	StaticPropsValue<typeof props>
> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, propsValue, lastFetchEpochMS }) => {
		const bo = propsValue.businessObject as {
			objectType?: string;
			customPath?: string;
			customService?: string;
		};
		const config = resolveBusinessObject(
			propsValue.module,
			bo.objectType,
			bo.customPath,
			bo.customService,
		);
		const isTest = lastFetchEpochMS === 0;
		const updatedAfter = isTest
			? dayjs().subtract(7, 'day').toISOString()
			: dayjs(lastFetchEpochMS).toISOString();

		const queryParams: QueryParams = {
			updatedSince: updatedAfter,
			...(propsValue.additionalFilters as Record<string, string> | undefined),
		};

		const records = isTest
			? (
					await workdayRequest<{ data?: Record<string, unknown>[] }>(
						auth,
						HttpMethod.GET,
						config.path,
						undefined,
						{ ...queryParams, limit: '10' },
						config.service,
					)
			  ).body.data ?? []
			: await fetchAllPages<Record<string, unknown>>(
					auth,
					config.path,
					queryParams,
					'data',
					config.service,
			  );

		const module = toWorkdayModule(propsValue.module);
		const formatted = formatWorkdayOutputs(records, module);
		if (formatted.length === 0) {
			return [];
		}

		const latestTimestamp = formatted.reduce((latest, record) => {
			const raw = getRecordTimestamp(record, propsValue.dateField);
			const value = raw ? dayjs(raw).valueOf() : 0;
			return Math.max(latest, value);
		}, 0);

		return [
			{
				epochMilliSeconds: latestTimestamp || Date.now(),
				data: {
					total_count: formatted.length,
					records: formatted,
				},
			},
		];
	},
};

export const newOrUpdatedBusinessObjectBatch = createTrigger({
	auth: workdayAuth,
	name: 'new_or_updated_business_object_batch',
	displayName: 'New/Updated Business Object (Batch)',
	description:
		'Triggers with a batch of new or updated business objects in a single poll cycle.',
	props,
	sampleData: {
		total_count: 2,
		records: [
			{
				job_requisition_id: 'req-001',
				title: 'Software Engineer',
				location: 'Remote',
				application_status: 'Open',
			},
		],
	},
	type: TriggerStrategy.POLLING,
	async test(ctx) {
		return await pollingHelper.test(polling, {
			auth: ctx.auth,
			store: ctx.store,
			propsValue: ctx.propsValue,
			files: ctx.files,
		});
	},
	async onEnable(ctx) {
		await pollingHelper.onEnable(polling, {
			auth: ctx.auth,
			store: ctx.store,
			propsValue: ctx.propsValue,
		});
	},
	async onDisable(ctx) {
		await pollingHelper.onDisable(polling, {
			auth: ctx.auth,
			store: ctx.store,
			propsValue: ctx.propsValue,
		});
	},
	async run(ctx) {
		return await pollingHelper.poll(polling, {
			auth: ctx.auth,
			store: ctx.store,
			propsValue: ctx.propsValue,
			files: ctx.files,
		});
	},
});
