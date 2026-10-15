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
		const module = workdayUtils.toWorkdayModule({ module: propsValue.module });
		const isTest = lastFetchEpochMS === 0;
		const updatedAfter = isTest
			? dayjs().subtract(7, 'day').toISOString()
			: dayjs(lastFetchEpochMS).toISOString();

		const queryParams: QueryParams = {
			updatedSince: updatedAfter,
			...workdayUtils.toQueryParams({ value: propsValue.additionalFilters }),
		};
		queryParams['limit'] = isTest ? '10' : '50';

		const records = await workdayApi.listBusinessObjects({
			auth,
			businessObject,
			query: queryParams,
		});

		return records.map((record) => {
			const timestamp =
				workdayUtils.getRecordTimestamp({ record, preferredField: propsValue.dateField }) ??
				new Date().toISOString();
			return {
				epochMilliSeconds: dayjs(timestamp).valueOf(),
				data: workdayUtils.formatOutput({ record, module }),
			};
		});
	},
};

export const newOrUpdatedBusinessObjectTrigger = createTrigger({
	auth: workdayAuth,
	name: 'new_or_updated_business_object',
	classification: 'READ',
	displayName: 'New/Updated Business Object',
	description:
		'Triggers when a business object is created or updated in Recruiting, Onboarding, or HR Services & Time Tracking.',
	aiMetadata: {
		description:
			'Fires once per Workday business object created or changed since the last poll, for the module (Recruiting, Onboarding, or HR Services & Time Tracking) and object type selected, or for a custom REST path. Recency is judged by a configurable date field, defaulting to lastFunctionallyUpdated, and optional JSON filters narrow the polled set. Use when downstream work should run per record; use the batch variant to handle all changed records in one run.',
	},
	props,
	sampleData: {
		job_requisition_id: '3aa5550b7fe348b98d7b5741afc65534',
		title: 'Software Engineer',
		location: 'San Francisco',
		candidate_id: 'candidate-001',
		application_status: 'In Progress',
	},
	type: TriggerStrategy.POLLING,
	async test(context) {
		return await pollingHelper.test(polling, context);
	},
	async onEnable(context) {
		await pollingHelper.onEnable(polling, context);
	},
	async onDisable(context) {
		await pollingHelper.onDisable(polling, context);
	},
	async run(context) {
		return await pollingHelper.poll(polling, context);
	},
});
