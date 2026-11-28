import { describe, expect, it } from 'vitest';
import { jsmTransitions } from '../src/lib/common/transitions';

const transitions = [
	{ id: '31', name: 'Investigate', to: { name: 'Work in progress' } },
	{
		id: '111',
		name: 'Resolve',
		to: { name: 'Completed' },
		fields: { resolution: { required: true, allowedValues: [{ id: '10000', name: 'Done' }, { id: '10001', name: "Won't Do" }] } },
	},
];

describe('jsmTransitions', () => {
	it('finds a transition by id or by name, ignoring case', () => {
		expect(jsmTransitions.find({ transitions, idOrName: '111' })?.name).toBe('Resolve');
		expect(jsmTransitions.find({ transitions, idOrName: ' resolve ' })?.id).toBe('111');
		expect(jsmTransitions.find({ transitions, idOrName: 'Close' })).toBeUndefined();
	});

	it('knows which transitions need a resolution', () => {
		expect(jsmTransitions.needsResolution(transitions[0])).toBe(false);
		expect(jsmTransitions.needsResolution(transitions[1])).toBe(true);
		expect(jsmTransitions.resolutionsOf(transitions[0])).toEqual([]);
	});

	it('finds a resolution by id or name among the allowed values', () => {
		expect(jsmTransitions.findResolution({ transition: transitions[1], idOrName: 'done' })?.id).toBe('10000');
		expect(jsmTransitions.findResolution({ transition: transitions[1], idOrName: '10001' })?.name).toBe("Won't Do");
		expect(jsmTransitions.findResolution({ transition: transitions[1], idOrName: 'Fixed' })).toBeUndefined();
	});
});
