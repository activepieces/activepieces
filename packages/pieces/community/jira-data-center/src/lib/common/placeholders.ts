export const MISSING_ACCOUNT_PLACEHOLDER = 'Please connect your account first';

export function waitingPlaceholder({ auth, waitingFor }: { auth: unknown; waitingFor: string }): string {
	return auth ? waitingFor : MISSING_ACCOUNT_PLACEHOLDER;
}
