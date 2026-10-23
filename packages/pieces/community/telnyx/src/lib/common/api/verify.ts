import { HttpMethod, QueryParams } from '@activepieces/pieces-common';

import { telnyxClient } from '../client';

import type { TelnyxAuthValue, TelnyxPage, TelnyxRecord } from '../types';

async function sendVerification({
	auth,
	channel,
	body,
}: BodyParams & {
	auth: TelnyxAuthValue;
	channel: 'sms' | 'call' | 'flashcall';
}): Promise<TelnyxRecord | undefined> {
	const response = await telnyxClient.request<{ data?: TelnyxRecord }>({
		auth,
		method: HttpMethod.POST,
		path: `/verifications/${channel}`,
		body,
	});
	return response.data;
}

async function getVerification({
	auth,
	verificationId,
}: {
	auth: TelnyxAuthValue;
	verificationId: string;
}): Promise<TelnyxRecord | undefined> {
	const response = await telnyxClient.request<{ data?: TelnyxRecord }>({
		auth,
		method: HttpMethod.GET,
		path: `/verifications/${encodeURIComponent(verificationId)}`,
	});
	return response.data;
}

async function listVerificationsByPhoneNumber({
	auth,
	phoneNumber,
}: {
	auth: TelnyxAuthValue;
	phoneNumber: string;
}): Promise<TelnyxPage> {
	return await telnyxClient.request<TelnyxPage>({
		auth,
		method: HttpMethod.GET,
		path: `/verifications/by_phone_number/${encodeURIComponent(phoneNumber)}`,
	});
}

async function checkVerificationCodeByPhoneNumber({
	auth,
	phoneNumber,
	body,
}: BodyParams & {
	auth: TelnyxAuthValue;
	phoneNumber: string;
}): Promise<TelnyxRecord | undefined> {
	const response = await telnyxClient.request<{ data?: TelnyxRecord }>({
		auth,
		method: HttpMethod.POST,
		path: `/verifications/by_phone_number/${encodeURIComponent(phoneNumber)}/actions/verify`,
		body,
	});
	return response.data;
}

async function checkVerificationCode({
	auth,
	verificationId,
	body,
}: BodyParams & {
	auth: TelnyxAuthValue;
	verificationId: string;
}): Promise<TelnyxRecord | undefined> {
	const response = await telnyxClient.request<{ data?: TelnyxRecord }>({
		auth,
		method: HttpMethod.POST,
		path: `/verifications/${encodeURIComponent(verificationId)}/actions/verify`,
		body,
	});
	return response.data;
}

async function listVerifyProfiles({
	auth,
	query,
}: QueryOnlyParams & { auth: TelnyxAuthValue }): Promise<TelnyxPage> {
	return await telnyxClient.request<TelnyxPage>({
		auth,
		method: HttpMethod.GET,
		path: '/verify_profiles',
		query,
	});
}

async function createVerifyProfile({
	auth,
	body,
}: BodyParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord | undefined> {
	const response = await telnyxClient.request<{ data?: TelnyxRecord }>({
		auth,
		method: HttpMethod.POST,
		path: '/verify_profiles',
		body,
	});
	return response.data;
}

async function getVerifyProfile({
	auth,
	verifyProfileId,
}: {
	auth: TelnyxAuthValue;
	verifyProfileId: string;
}): Promise<TelnyxRecord | undefined> {
	const response = await telnyxClient.request<{ data?: TelnyxRecord }>({
		auth,
		method: HttpMethod.GET,
		path: `/verify_profiles/${encodeURIComponent(verifyProfileId)}`,
	});
	return response.data;
}

async function updateVerifyProfile({
	auth,
	verifyProfileId,
	body,
}: BodyParams & {
	auth: TelnyxAuthValue;
	verifyProfileId: string;
}): Promise<TelnyxRecord | undefined> {
	const response = await telnyxClient.request<{ data?: TelnyxRecord }>({
		auth,
		method: HttpMethod.PATCH,
		path: `/verify_profiles/${encodeURIComponent(verifyProfileId)}`,
		body,
	});
	return response.data;
}

async function deleteVerifyProfile({
	auth,
	verifyProfileId,
}: {
	auth: TelnyxAuthValue;
	verifyProfileId: string;
}): Promise<TelnyxRecord | undefined> {
	const response = await telnyxClient.request<{ data?: TelnyxRecord }>({
		auth,
		method: HttpMethod.DELETE,
		path: `/verify_profiles/${encodeURIComponent(verifyProfileId)}`,
	});
	return response.data;
}

async function listVerifyTemplates({ auth }: { auth: TelnyxAuthValue }): Promise<TelnyxRecord[]> {
	const response = await telnyxClient.request<{ data?: TelnyxRecord[] }>({
		auth,
		method: HttpMethod.GET,
		path: '/verify_profiles/templates',
	});
	return response.data ?? [];
}

async function createVerifyTemplate({
	auth,
	text,
}: {
	auth: TelnyxAuthValue;
	text: string;
}): Promise<TelnyxRecord | undefined> {
	const response = await telnyxClient.request<{ data?: TelnyxRecord }>({
		auth,
		method: HttpMethod.POST,
		path: '/verify_profiles/templates',
		body: { text },
	});
	return response.data;
}

async function updateVerifyTemplate({
	auth,
	templateId,
	text,
}: {
	auth: TelnyxAuthValue;
	templateId: string;
	text: string;
}): Promise<TelnyxRecord | undefined> {
	const response = await telnyxClient.request<{ data?: TelnyxRecord }>({
		auth,
		method: HttpMethod.PATCH,
		path: `/verify_profiles/templates/${encodeURIComponent(templateId)}`,
		body: { text },
	});
	return response.data;
}

async function listVerifiedNumbers({
	auth,
	query,
}: QueryOnlyParams & { auth: TelnyxAuthValue }): Promise<TelnyxPage> {
	return await telnyxClient.request<TelnyxPage>({
		auth,
		method: HttpMethod.GET,
		path: '/verified_numbers',
		query,
	});
}

async function requestNumberVerification({
	auth,
	body,
}: BodyParams & { auth: TelnyxAuthValue }): Promise<TelnyxRecord> {
	return await telnyxClient.request<TelnyxRecord>({
		auth,
		method: HttpMethod.POST,
		path: '/verified_numbers',
		body,
	});
}

async function getVerifiedNumber({
	auth,
	phoneNumber,
}: {
	auth: TelnyxAuthValue;
	phoneNumber: string;
}): Promise<TelnyxRecord | undefined> {
	const response = await telnyxClient.request<{ data?: TelnyxRecord }>({
		auth,
		method: HttpMethod.GET,
		path: `/verified_numbers/${encodeURIComponent(phoneNumber)}`,
	});
	return response.data;
}

async function submitNumberVerificationCode({
	auth,
	phoneNumber,
	verificationCode,
}: {
	auth: TelnyxAuthValue;
	phoneNumber: string;
	verificationCode: string;
}): Promise<TelnyxRecord | undefined> {
	const response = await telnyxClient.request<{ data?: TelnyxRecord }>({
		auth,
		method: HttpMethod.POST,
		path: `/verified_numbers/${encodeURIComponent(phoneNumber)}/actions/verify`,
		body: { verification_code: verificationCode },
	});
	return response.data;
}

async function deleteVerifiedNumber({
	auth,
	phoneNumber,
}: {
	auth: TelnyxAuthValue;
	phoneNumber: string;
}): Promise<TelnyxRecord | undefined> {
	const response = await telnyxClient.request<{ data?: TelnyxRecord }>({
		auth,
		method: HttpMethod.DELETE,
		path: `/verified_numbers/${encodeURIComponent(phoneNumber)}`,
	});
	return response.data;
}

export const telnyxVerifyApi = {
	sendVerification,
	getVerification,
	listVerificationsByPhoneNumber,
	checkVerificationCodeByPhoneNumber,
	checkVerificationCode,
	listVerifyProfiles,
	createVerifyProfile,
	getVerifyProfile,
	updateVerifyProfile,
	deleteVerifyProfile,
	listVerifyTemplates,
	createVerifyTemplate,
	updateVerifyTemplate,
	listVerifiedNumbers,
	requestNumberVerification,
	getVerifiedNumber,
	submitNumberVerificationCode,
	deleteVerifiedNumber,
};

type BodyParams = { body: Record<string, unknown> };
type QueryOnlyParams = { query: QueryParams };
