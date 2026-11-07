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
	source: workdayProps.source({ required: false }),
	module: workdayProps.module({
		required: false,
		description:
			'Workday functional area: Recruiting, Onboarding, or HR Services & Time Tracking. Only used with the REST source.',
	}),
	businessObject: workdayProps.businessObject({
		required: true,
		changeTrackingOnly: true,
	}),
	dateField: workdayProps.dateField({
		required: false,
		description:
			'Field used to detect new/updated records (e.g. `lastFunctionallyUpdated`). Only used with the REST source.',
	}),
	additionalFilters: Property.Json({
		displayName: 'Additional Filters (JSON)',
		description: 'Optional REST query parameters. Only used with the REST source.',
		required: false,
	}),
};

const polling: Polling<
	AppConnectionValueForAuthProperty<typeof workdayAuth>,
	StaticPropsValue<typeof props>
> = {
	strategy: DedupeStrategy.TIMEBASED,
	items: async ({ auth, propsValue, lastFetchEpochMS }) => {
		if (propsValue.source === 'wws') {
			const { records, updatedThroughEpochMS } = await workdayApi.listChangedSoapObjects({
				auth,
				object: workdayUtils.resolveSoapObject({
					value: propsValue.businessObject['objectType'],
				}),
				sinceEpochMS: lastFetchEpochMS,
			});
			if (records.length === 0) {
				return [];
			}
			return [
				{
					epochMilliSeconds: updatedThroughEpochMS,
					data: { total_count: records.length, records },
				},
			];
		}
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

		const module = workdayUtils.toWorkdayModule({
			module: propsValue.module ?? '',
		});
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
			"Fires once per poll cycle carrying every Workday business object created or changed since the previous poll as a single batch. With the SOAP source (the default, needs ISU credentials) it uses Workday's transaction log for Worker, Job Profile, Position, Job Requisition, or Evergreen Requisition. With the REST source it polls a module's Worker, Case, or Time Entry collection or a custom REST path, judging recency by a configurable date field (default lastFunctionallyUpdated). Use when the whole changed set should be processed at once instead of one flow run per record.",
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
