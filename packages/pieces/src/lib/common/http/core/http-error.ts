import { AxiosError } from 'axios';

export class HttpError extends Error {
	constructor(
		public readonly requestBody: unknown,
		public readonly err: AxiosError,
	) {
		super(JSON.stringify({
			response: {
				status: err?.response?.status || 500,
				body: err?.response?.data
			},
			request: {
				body: requestBody
			}
		}));
	}
}
