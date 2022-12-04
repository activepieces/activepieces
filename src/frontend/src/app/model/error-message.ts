export interface ErrorMessage {
	message: string;
	errorCode: ErrorCode;
}

export enum ErrorCode {
	USER_TRIAL_EXPIRED = 'USER_TRIAL_EXPIRED',
}
