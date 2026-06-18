import { describe, expect, it } from 'vitest';
import { resolveBusinessObject, toWorkdayModule } from './modules';
import { WorkdayService } from './index';

describe('resolveBusinessObject', () => {
	it('resolves a standard business object for a module', () => {
		const config = resolveBusinessObject('recruiting', 'jobRequisitions', undefined, undefined);
		expect(config.path).toBe('/jobRequisitions');
		expect(config.service).toBe(WorkdayService.staffing);
	});

	it('builds a custom object config from a path', () => {
		const config = resolveBusinessObject('recruiting', '__custom__', 'invoices', WorkdayService.common);
		expect(config.path).toBe('/invoices');
		expect(config.service).toBe(WorkdayService.common);
	});

	it('prefixes a missing slash on custom paths', () => {
		const config = resolveBusinessObject('onboarding', '__custom__', 'workers', undefined);
		expect(config.path).toBe('/workers');
	});

	it('throws when a custom path is missing', () => {
		expect(() => resolveBusinessObject('recruiting', '__custom__', '', undefined)).toThrow(
			'Custom Business Object Path is required',
		);
	});

	it('throws for an unknown business object', () => {
		expect(() => resolveBusinessObject('recruiting', 'nope', undefined, undefined)).toThrow();
	});
});

describe('toWorkdayModule', () => {
	it('accepts the three supported modules', () => {
		expect(toWorkdayModule('recruiting')).toBe('recruiting');
		expect(toWorkdayModule('onboarding')).toBe('onboarding');
		expect(toWorkdayModule('hr_services_time_tracking')).toBe('hr_services_time_tracking');
	});

	it('throws for an invalid module', () => {
		expect(() => toWorkdayModule('finance')).toThrow();
	});
});
