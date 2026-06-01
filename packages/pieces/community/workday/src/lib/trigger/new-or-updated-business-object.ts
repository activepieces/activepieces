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
import { workdayRequest } from '../common';
import { formatWorkdayOutput, getRecordTimestamp } from '../common/fields';
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
		const module = toWorkdayModule(propsValue.module);
		const isTest = lastFetchEpochMS === 0;
		const updatedAfter = isTest
			? dayjs().subtract(7, 'day').toISOString()
			: dayjs(lastFetchEpochMS).toISOString();

		const queryParams: QueryParams = {
			updatedSince: updatedAfter,
			...(propsValue.additionalFilters as Record<string, string> | undefined),
		};
		queryParams['limit'] = isTest ? '10' : '50';

		const response = await workdayRequest<{ data?: Record<string, unknown>[] }>(
			auth,
			HttpMethod.GET,
			config.path,
			undefined,
			queryParams,
			config.service,
		);
		const records = response.body.data ?? [];

		return records.map((record) => {
			const timestamp =
				getRecordTimestamp(record, propsValue.dateField) ??
				new Date().toISOString();
			return {
				epochMilliSeconds: dayjs(timestamp).valueOf(),
				data: formatWorkdayOutput(record, module),
			};
		});
	},
};

export const newOrUpdatedBusinessObject = createTrigger({
	auth: workdayAuth,
	name: 'new_or_updated_business_object',
	displayName: 'New/Updated Business Object',
	description:
		'Triggers when a business object is created or updated in Recruiting, Onboarding, or HR Services & Time Tracking.',
	props,
	sampleData: {
		job_requisition_id: '3aa5550b7fe348b98d7b5741afc65534',
		title: 'Software Engineer',
		location: 'San Francisco',
		candidate_id: 'candidate-001',
		application_status: 'In Progress',
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
