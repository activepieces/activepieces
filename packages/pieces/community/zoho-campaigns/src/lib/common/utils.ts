import type { ZohoCampaignsResponse } from './types';

function assertSuccess<T extends ZohoCampaignsResponse>({ body }: { body: T }): T {
	const status = body.status ?? body.response?.status;
	const code = body.code ?? body.response?.code;
	const failed =
		status === 'error' ||
		status === 'failure' ||
		(status === undefined && code !== undefined && !SUCCESS_CODES.includes(String(code)));
	if (failed) {
		const message = body.message ?? body.response?.message;
		throw new Error(
			message
				? `Zoho Campaigns returned an error (code ${code}): ${message}`
				: `Zoho Campaigns returned an error: ${JSON.stringify(body)}`,
		);
	}
	return body;
}

function joinEmails({
	emails,
	propName,
}: {
	emails: unknown[] | undefined;
	propName: string;
}): string {
	const list = emails ?? [];
	if (
		list.length === 0 ||
		list.length > MAX_EMAILS ||
		!list.every((email): email is string => typeof email === 'string' && email !== '')
	) {
		throw new Error(`${propName} must hold 1 to ${MAX_EMAILS} non-empty email addresses.`);
	}
	return list.join(',');
}

function contactInfo({
	email,
	firstName,
	lastName,
	phone,
	companyName,
	additionalFields,
}: ContactInfoParams): Record<string, unknown> {
	return {
		...additionalFields,
		'Contact Email': email,
		...(firstName && { 'First Name': firstName }),
		...(lastName && { 'Last Name': lastName }),
		...(phone && { Phone: phone }),
		...(companyName && { 'Company Name': companyName }),
	};
}

export const zohoCampaignsUtils = { assertSuccess, joinEmails, contactInfo };

const MAX_EMAILS = 10;
const SUCCESS_CODES = ['0', '200'];

type ContactInfoParams = {
	email: string;
	firstName?: string;
	lastName?: string;
	phone?: string;
	companyName?: string;
	additionalFields?: Record<string, unknown>;
};
