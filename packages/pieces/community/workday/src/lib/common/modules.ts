import { Property } from '@activepieces/pieces-framework';
import { ServicePath, WorkdayService } from './index';
import { WorkdayModule } from './fields';

export const WORKDAY_MODULE_OPTIONS = [
	{ label: 'Recruiting', value: 'recruiting' },
	{ label: 'Onboarding', value: 'onboarding' },
	{ label: 'HR Services & Time Tracking', value: 'hr_services_time_tracking' },
];

export const BUSINESS_OBJECTS_BY_MODULE: Record<string, BusinessObjectConfig[]> = {
	recruiting: [
		{
			label: 'Job Requisition',
			value: 'jobRequisitions',
			path: '/jobRequisitions',
			service: WorkdayService.staffing,
			wqlDataSource: 'jobRequisitions',
		},
		{
			label: 'Job Application',
			value: 'jobApplications',
			path: '/jobApplications',
			service: WorkdayService.staffing,
			wqlDataSource: 'jobApplications',
		},
		{
			label: 'Candidate',
			value: 'candidates',
			path: '/candidates',
			service: WorkdayService.staffing,
			wqlDataSource: 'candidates',
		},
	],
	onboarding: [
		{
			label: 'Worker',
			value: 'workers',
			path: '/workers',
			service: WorkdayService.staffing,
			wqlDataSource: 'allWorkers',
		},
		{
			label: 'Pre-Hire',
			value: 'preHires',
			path: '/preHires',
			service: WorkdayService.staffing,
			wqlDataSource: 'preHires',
		},
	],
	hr_services_time_tracking: [
		{
			label: 'Case',
			value: 'cases',
			path: '/cases',
			service: WorkdayService.common,
			wqlDataSource: 'cases',
		},
		{
			label: 'Time Entry',
			value: 'timeEntries',
			path: '/timeEntries',
			service: WorkdayService.timeTracking,
			wqlDataSource: 'workerTimeBlocks',
		},
	],
};

export const moduleProperty = Property.StaticDropdown({
	displayName: 'Module',
	description:
		'Workday functional area: Recruiting, Onboarding, or HR Services & Time Tracking.',
	required: true,
	options: {
		disabled: false,
		options: WORKDAY_MODULE_OPTIONS,
	},
});

export const customBusinessObjectProperty = Property.ShortText({
	displayName: 'Custom Business Object Path',
	description:
		'REST path segment when using a custom object, e.g. `/jobRequisitions`.',
	required: false,
});

export const customServiceProperty = Property.StaticDropdown({
	displayName: 'Custom API Service',
	description: 'API service prefix for custom business object paths.',
	required: false,
	options: {
		disabled: false,
		options: [
			{ label: 'Common (v1)', value: WorkdayService.common },
			{ label: 'Staffing (v6)', value: WorkdayService.staffing },
			{ label: 'Time Tracking (v2)', value: WorkdayService.timeTracking },
			{ label: 'Expense Management', value: WorkdayService.expenseManagement },
			{ label: 'Resource Management', value: WorkdayService.resourceManagement },
		],
	},
});

export function resolveBusinessObject(
	module: string | undefined,
	businessObject: string | undefined,
	customPath: string | undefined,
	customService: string | undefined,
): BusinessObjectConfig {
	if (businessObject === '__custom__') {
		if (!customPath?.trim()) {
			throw new Error('Custom Business Object Path is required for custom objects.');
		}
		const path = customPath.startsWith('/') ? customPath : `/${customPath}`;
		return {
			label: 'Custom',
			value: 'custom',
			path,
			service: (customService as ServicePath) ?? WorkdayService.common,
		};
	}
	const objects = BUSINESS_OBJECTS_BY_MODULE[module ?? ''] ?? [];
	const found = objects.find((item) => item.value === businessObject);
	if (!found) {
		throw new Error('Select a valid business object for the chosen module.');
	}
	return found;
}

export function businessObjectPropertyForModule(module: string) {
	const moduleObjects = BUSINESS_OBJECTS_BY_MODULE[module] ?? [];
	return Property.StaticDropdown({
		displayName: 'Business Object',
		description: 'Workday business object to work with.',
		required: true,
		options: {
			disabled: moduleObjects.length === 0,
			options: [
				...moduleObjects.map((item) => ({
					label: item.label,
					value: item.value,
				})),
				{ label: 'Custom object (path below)', value: '__custom__' },
			],
		},
	});
}

export function toWorkdayModule(module: string): WorkdayModule {
	if (
		module === 'recruiting' ||
		module === 'onboarding' ||
		module === 'hr_services_time_tracking'
	) {
		return module;
	}
	throw new Error('Invalid Workday module selected.');
}

export type BusinessObjectConfig = {
	label: string;
	value: string;
	path: string;
	service: ServicePath;
	wqlDataSource?: string;
};
