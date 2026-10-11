import { HttpMethod } from '@activepieces/pieces-common';
import { softrClient } from './client';

async function setUserStatus({ apiKey, domain, email, status }: SetUserStatusParams): Promise<UserStatusResult> {
	const trimmedEmail = email.trim();
	if (trimmedEmail.length === 0) {
		throw new Error('User email is required.');
	}
	await softrClient.studioRequest({
		apiKey,
		domain,
		method: HttpMethod.POST,
		path: `/${encodeURIComponent(trimmedEmail)}/${status}`,
	});
	return { success: true, email: trimmedEmail, message: status === 'activate' ? 'User activated' : 'User deactivated' };
}

type SetUserStatusParams = {
	apiKey: string;
	domain: string;
	email: string;
	status: 'activate' | 'deactivate';
};

type UserStatusResult = {
	success: true;
	email: string;
	message: string;
};

export const softrAppUsers = {
	setUserStatus,
};
