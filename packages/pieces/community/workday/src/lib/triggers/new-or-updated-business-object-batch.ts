import dayjs from 'dayjs';

import { DedupeStrategy, Polling, QueryParams, pollingHelper } from '@activepieces/pieces-common';
import {
	AppConnectionValueForAuthProperty,
	Property,
	StaticPropsValue,
	TriggerStrategy,
	createTrigger,
} from '@activepieces/pieces-framework';

import { workdayAuth } from '../auth';
import { workdayApi } from '../common/api';
import { workdayProps } from '../common/props';
import { workdayUtils } from '../common/utils';

const props = {
	module: workdayProps.module({ required: true }),
	businessObject: workdayProps.businessObject({ required: true }),
	dateField: workdayProps.dateField({ required: false }),
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
		const businessObject = workdayUtils.resolveBusinessObject({
			module: propsValue.module,
			selection: propsValue.businessObject,
		});
		const isTest = lastFetchEpochMS === 0;
		const updatedAfter = isTest
			? dayjs().subtract(7, 'day').toISOString()
			: dayjs(lastFetchEpochMS).toISOString();

		const queryParams: QueryParams = {
			updatedSince: updatedAfter,
			...workdayUtils.toQueryParams({ value: propsValue.additionalFilters }),
		};

		const records = isTest
			? await workdayApi.listBusinessObjects({
					auth,
					businessObject,
					query: { ...queryParams, limit: '10' },
			  })
			: await workdayApi.searchBusinessObjects({ auth, businessObject, query: queryParams });

		const module = workdayUtils.toWorkdayModule({ module: propsValue.module });
		const formatted = workdayUtils.formatOutputs({ records, module });
		if (formatted.length === 0) {
			return [];
		}

		const latestTimestamp = formatted.reduce((latest, record) => {
			const raw = workdayUtils.getRecordTimestamp({ record, preferredField: propsValue.dateField });
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

export const newOrUpdatedBusinessObjectBatchTrigger = createTrigger({
	auth: workdayAuth,
	name: 'new_or_updated_business_object_batch',
	classification: 'READ',
	displayName: 'New/Updated Business Object (Batch)',
	description: 'Triggers with a batch of new or updated business objects in a single poll cycle.',
	aiMetadata: {
		description:
			'Fires once per poll cycle carrying every Workday business object created or changed since the previous poll as a single batch, for the module (Recruiting, Onboarding, or HR Services & Time Tracking) and object type selected, or for a custom REST path. Recency is judged by a configurable date field, defaulting to lastFunctionallyUpdated. Use when the whole changed set should be processed at once instead of one flow run per record.',
	},
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
	async test(context) {
		return await pollingHelper.test(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue,
			files: context.files,
		});
	},
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
	async run(context) {
		return await pollingHelper.poll(polling, {
			auth: context.auth,
			store: context.store,
			propsValue: context.propsValue,
			files: context.files,
		});
	},
});
