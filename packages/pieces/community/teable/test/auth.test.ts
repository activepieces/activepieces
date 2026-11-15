import { describe, expect, it } from 'vitest';
import { AppConnectionType } from '@activepieces/pieces-framework';
import { teableAuthUtil, TeableAuthValue } from '../src/lib/auth';

describe('normalizeBaseUrl', () => {
	it('defaults to Teable Cloud when empty', () => {
		expect(teableAuthUtil.normalizeBaseUrl(undefined)).toBe('https://app.teable.ai');
		expect(teableAuthUtil.normalizeBaseUrl('')).toBe('https://app.teable.ai');
		expect(teableAuthUtil.normalizeBaseUrl('   ')).toBe('https://app.teable.ai');
	});

	it('trims and strips trailing slashes', () => {
		expect(teableAuthUtil.normalizeBaseUrl(' https://app.teable.ai/ ')).toBe('https://app.teable.ai');
		expect(teableAuthUtil.normalizeBaseUrl('https://teable.example.com///')).toBe('https://teable.example.com');
	});

	it('strips a trailing /api', () => {
		expect(teableAuthUtil.normalizeBaseUrl('https://teable.example.com/api')).toBe('https://teable.example.com');
		expect(teableAuthUtil.normalizeBaseUrl('https://teable.example.com/api/')).toBe('https://teable.example.com');
	});

	it('keeps a custom port', () => {
		expect(teableAuthUtil.normalizeBaseUrl('http://localhost:3000')).toBe('http://localhost:3000');
	});

	it('rejects a URL without a scheme', () => {
		expect(() => teableAuthUtil.normalizeBaseUrl('app.teable.ai')).toThrow(/scheme/);
	});

	it('rejects non-http schemes', () => {
		expect(() => teableAuthUtil.normalizeBaseUrl('ftp://teable.example.com')).toThrow(/http/);
	});

	it('rejects embedded credentials', () => {
		expect(() => teableAuthUtil.normalizeBaseUrl('https://user:pass@teable.example.com')).toThrow(
			/credentials/
		);
	});

	it('rejects paths beyond /api', () => {
		expect(() => teableAuthUtil.normalizeBaseUrl('https://teable.example.com/tenant1')).toThrow(/path/);
		expect(() => teableAuthUtil.normalizeBaseUrl('https://teable.example.com/../x')).toThrow(/path/);
	});

	it('neutralizes dot segments through URL normalization', () => {
		expect(teableAuthUtil.normalizeBaseUrl('https://teable.example.com/..')).toBe(
			'https://teable.example.com'
		);
	});

	it('rejects query strings and fragments', () => {
		expect(() => teableAuthUtil.normalizeBaseUrl('https://teable.example.com/?x=1')).toThrow(
			/query/
		);
	});
});

describe('getToken / getBaseUrl', () => {
	const oauthTypes = [
		AppConnectionType.OAUTH2,
		AppConnectionType.CLOUD_OAUTH2,
		AppConnectionType.PLATFORM_OAUTH2,
	] as const;

	it.each(oauthTypes)('reads access_token and cloud URL for %s connections', (type) => {
		const auth: TeableAuthValue = { type, access_token: 'oauth-token' };
		expect(teableAuthUtil.getToken(auth)).toBe('oauth-token');
		expect(teableAuthUtil.getBaseUrl(auth)).toBe('https://app.teable.ai');
	});

	it('reads the PAT and normalized base URL for CUSTOM_AUTH connections', () => {
		const auth: TeableAuthValue = {
			type: AppConnectionType.CUSTOM_AUTH,
			props: { token: ' pat-token ', baseUrl: 'https://teable.example.com/' },
		};
		expect(teableAuthUtil.getToken(auth)).toBe('pat-token');
		expect(teableAuthUtil.getBaseUrl(auth)).toBe('https://teable.example.com');
	});

	it('defaults CUSTOM_AUTH without a base URL to Teable Cloud', () => {
		const auth: TeableAuthValue = {
			type: AppConnectionType.CUSTOM_AUTH,
			props: { token: 'pat-token' },
		};
		expect(teableAuthUtil.getBaseUrl(auth)).toBe('https://app.teable.ai');
	});
});

describe('normalizeBaseUrl pasted app URLs', () => {
	it('strips a pasted Teable app path down to the origin', () => {
		expect(teableAuthUtil.normalizeBaseUrl('https://app.teable.ai/base/bseXXXXXXXXXXXXXXXX')).toBe(
			'https://app.teable.ai'
		);
		expect(teableAuthUtil.normalizeBaseUrl('https://teable.example.com/space/spcX')).toBe(
			'https://teable.example.com'
		);
	});
});
