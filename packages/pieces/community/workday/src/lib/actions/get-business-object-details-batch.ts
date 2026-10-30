import { Property, createAction } from '@activepieces/pieces-framework';

import { workdayAuth } from '../auth';
import { workdayApi } from '../common/api';
import { workdayProps } from '../common/props';
import { workdayUtils } from '../common/utils';

export const getBusinessObjectDetailsBatchAction = createAction({
	auth: workdayAuth,
	name: 'get_business_object_details_batch',
	classification: 'READ',
	displayName: 'Get Business Object Details (Batch)',
	description: 'Retrieves details for one or more business objects by ID in a single step.',
	audience: 'both',
	aiMetadata: {
		description:
			"Fetches the full record for one or more Workday business objects by ID in a single step, for one object type. With the SOAP source (the default, needs ISU credentials) it fetches all IDs in one request for Worker, Organization, Job Profile, Location, Job Family, Job Family Group, Job Classification Group, Position, Worker Document, Citizenship Status, Job Requisition, Evergreen Requisition, Applicant, Payee, or Customer Contract; IDs may be WIDs or the object ID (e.g. Employee ID), and an unknown ID fails the step with Workday's error. With the REST source it reads a module's Worker, Case, or Time Entry record or a custom REST path. Use when the record IDs are already known; use Search Business Object (Batch) to find records by criteria. Read-only and idempotent.",
		idempotent: true,
	},
	props: {
		source: workdayProps.source({ required: false }),
		module: workdayProps.module({
			required: false,
			description:
				'Workday functional area: Recruiting, Onboarding, or HR Services & Time Tracking. Only used with the REST source.',
		}),
		businessObject: workdayProps.businessObject({ required: true }),
		objectIds: Property.Array({
			displayName: 'Object IDs',
			description:
				'One or more record IDs to retrieve: WIDs, or with the SOAP source also the object ID (e.g. Employee ID for workers).',
			required: true,
			properties: {
				id: Property.ShortText({
					displayName: 'ID',
					required: true,
				}),
			},
		}),
	},
	async run({ auth, propsValue }) {
		const ids = propsValue.objectIds.flatMap((item) =>
			typeof item === 'object' && item !== null && 'id' in item ? [String(item.id)] : [],
		);
		if (ids.length === 0) {
			return { total_count: 0, records: [] };
		}
		if (propsValue.source === 'wws') {
			const soapRecords = await workdayApi.listSoapObjects({
				auth,
				object: workdayUtils.resolveSoapObject({
					value: propsValue.businessObject['objectType'],
				}),
				ids,
			});
			return {
				total_count: soapRecords.length,
				records: soapRecords,
			};
		}
		const businessObject = workdayUtils.resolveBusinessObject({
			module: propsValue.module,
			selection: propsValue.businessObject,
		});
		const module = workdayUtils.toWorkdayModule({ module: propsValue.module ?? '' });

		const records = await Promise.all(
			ids.map(async (id) => {
				const record = await workdayApi.getBusinessObject({ auth, businessObject, objectId: id });
				return workdayUtils.formatOutput({ record, module });
			}),
		);

		return {
			total_count: records.length,
			records,
		};
	},
});
