import { describe, expect, it } from 'vitest';
import { contactFlags } from './contact-flags';

describe('contactFlags.blacklistFlag', () => {
	it('sends true when the toggle is ticked', () => {
		expect(contactFlags.blacklistFlag(true)).toBe(true);
	});

	it('omits the flag when the toggle is unticked, so the contact is not re-subscribed', () => {
		expect(contactFlags.blacklistFlag(false)).toBeUndefined();
	});

	it('omits the flag when the toggle was never set', () => {
		expect(contactFlags.blacklistFlag(undefined)).toBeUndefined();
	});
});

describe('contactFlags.unsubscribeBody', () => {
	it('blacklists only the ticked channels', () => {
		expect(
			contactFlags.unsubscribeBody({
				unsubscribeEmail: true,
				unsubscribeSms: false,
				unlinkListIds: [],
			}),
		).toEqual({ emailBlacklisted: true, smsBlacklisted: undefined, unlinkListIds: undefined });
	});

	it('never sends false for an unticked channel', () => {
		const body = contactFlags.unsubscribeBody({
			unsubscribeEmail: false,
			unsubscribeSms: true,
			unlinkListIds: [],
		});

		expect(body.emailBlacklisted).toBeUndefined();
		expect(body.smsBlacklisted).toBe(true);
	});

	it('removes the contact from lists without touching either channel', () => {
		expect(
			contactFlags.unsubscribeBody({
				unsubscribeEmail: false,
				unsubscribeSms: undefined,
				unlinkListIds: [3, 42],
			}),
		).toEqual({ emailBlacklisted: undefined, smsBlacklisted: undefined, unlinkListIds: [3, 42] });
	});

	it('refuses an unsubscribe that would change nothing', () => {
		expect(() =>
			contactFlags.unsubscribeBody({
				unsubscribeEmail: false,
				unsubscribeSms: undefined,
				unlinkListIds: [],
			}),
		).toThrow('Tick Unsubscribe From Email or Unsubscribe From SMS, or pick a list to remove.');
	});
});
