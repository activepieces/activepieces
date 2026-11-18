import { createAction, Property } from '@activepieces/pieces-framework';
import { quickbooksAuth } from '../../../auth';
import { quickbooksAiProps } from '../../../common/ai-props';
import { quickbooksApi } from '../../../common/api';
import { quickbooksUtils } from '../../../common/utils';
import { quickbooksSandboxCreateTimeActivityOutputSchema } from '../../../output-schemas';

export const updateTimeActivityAction = createAction({
	auth: quickbooksAuth,
	name: 'quickbooks_sandbox_update_time_activity',
	outputSchema: quickbooksSandboxCreateTimeActivityOutputSchema,
	displayName: 'Update Time Activity',
	description: 'Changes fields of an existing time activity.',
	audience: 'ai',
	classification: 'WRITE',
	aiMetadata: {
		description:
			'Changes the fields you set on one time activity: reads it, applies your changes and sends the whole record back, so unset fields keep their values. Get the id from List Time Activities.',
		idempotent: true,
	},
	props: {
		timeActivityId: quickbooksAiProps.id({
			required: true,
			displayName: 'Time Activity ID',
			description: 'QuickBooks time activity id. Use List Time Activities to find it.',
		}),
		nameOf: Property.StaticDropdown({
			displayName: 'Name Of',
			description: 'New worker type: Employee (set Employee ID) or Vendor (set Vendor ID).',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Employee', value: 'Employee' },
					{ label: 'Vendor', value: 'Vendor' },
				],
			},
		}),
		employeeId: quickbooksAiProps.id({
			required: false,
			displayName: 'Employee ID',
			description: 'QuickBooks employee id, when Name Of is Employee. Use List Employees to find it.',
		}),
		vendorId: quickbooksAiProps.id({
			required: false,
			displayName: 'Vendor ID',
			description: 'QuickBooks vendor id, when Name Of is Vendor. Use List Vendors to find it.',
		}),
		customerId: quickbooksAiProps.id({
			required: false,
			displayName: 'Customer ID',
			description: 'Customer the time was worked for. Use List Customers to find it.',
		}),
		itemId: quickbooksAiProps.id({
			required: false,
			displayName: 'Service Item ID',
			description: 'Service item the time is billed as. Use List Items to find it.',
		}),
		txnDate: quickbooksAiProps.date({
			required: false,
			displayName: 'Date',
			description: 'New date of the work, YYYY-MM-DD.',
		}),
		hours: Property.Number({ displayName: 'Hours', description: 'Whole hours worked. Use with Minutes, or set Start Time and End Time instead.', required: false }),
		minutes: Property.Number({ displayName: 'Minutes', description: 'Extra minutes worked (0-59).', required: false }),
		startTime: Property.ShortText({
			displayName: 'Start Time',
			description: 'Start of the work, ISO 8601 with offset, e.g. 2025-05-01T09:00:00-07:00. Use with End Time instead of Hours.',
			required: false,
		}),
		endTime: Property.ShortText({
			displayName: 'End Time',
			description: 'End of the work, ISO 8601 with offset, e.g. 2025-05-01T17:00:00-07:00.',
			required: false,
		}),
		billableStatus: Property.StaticDropdown({
			displayName: 'Billable Status',
			description: 'Whether the time can be billed to the customer. Billable time needs a Customer ID.',
			required: false,
			options: {
				disabled: false,
				options: [
					{ label: 'Billable', value: 'Billable' },
					{ label: 'Not Billable', value: 'NotBillable' },
					{ label: 'Has Been Billed', value: 'HasBeenBilled' },
				],
			},
		}),
		hourlyRate: Property.Number({ displayName: 'Hourly Rate', description: 'Rate billed per hour for billable time.', required: false }),
		description: Property.LongText({ displayName: 'Description', description: 'Description of the work done.', required: false }),
		additionalFields: quickbooksAiProps.additionalFields({ required: false }),
	},
	async run(context) {
		const {
			timeActivityId,
			nameOf,
			employeeId,
			vendorId,
			customerId,
			itemId,
			txnDate,
			hours,
			minutes,
			startTime,
			endTime,
			billableStatus,
			hourlyRate,
			description,
			additionalFields,
		} = context.propsValue;
		checkWorker({ nameOf, employeeId, vendorId });
		return await quickbooksApi.replaceEntity({
			auth: context.auth,
			entity: 'TimeActivity',
			id: timeActivityId,
			fields: quickbooksUtils.requireChanges({
				fields: {
					...additionalFields,
					...quickbooksUtils.compact({
						fields: {
							NameOf: nameOf,
							EmployeeRef: quickbooksUtils.ref({ value: employeeId }),
							VendorRef: quickbooksUtils.ref({ value: vendorId }),
							CustomerRef: quickbooksUtils.ref({ value: customerId }),
							ItemRef: quickbooksUtils.ref({ value: itemId }),
							TxnDate: txnDate,
							Hours: hours,
							Minutes: minutes,
							StartTime: startTime,
							EndTime: endTime,
							BillableStatus: billableStatus,
							HourlyRate: hourlyRate,
							Description: description,
						},
					}),
				},
			}),
		});
	},
});


function checkWorker({
	nameOf,
	employeeId,
	vendorId,
}: {
	nameOf: string | undefined;
	employeeId: string | undefined;
	vendorId: string | undefined;
}): void {
	if (nameOf !== undefined && nameOf !== 'Employee' && nameOf !== 'Vendor') {
		throw new Error('Name Of must be Employee or Vendor.');
	}
	if (nameOf === 'Employee' && !employeeId) {
		throw new Error('Employee ID is required when Name Of is Employee.');
	}
	if (nameOf === 'Vendor' && !vendorId) {
		throw new Error('Vendor ID is required when Name Of is Vendor.');
	}
}
