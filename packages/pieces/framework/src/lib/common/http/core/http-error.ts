import { AxiosError } from 'axios';

export class HttpError extends Error {
	constructor(
		private readonly _requestBody: unknown,
		private readonly _err: AxiosError,
	) {
		super(JSON.stringify({
			response: {
				status: _err?.response?.status || 500,
				body: _err?.response?.data
			},
			request: {
				body: _requestBody
			}
		}));
	}

	get response() {
		return {
			status: this._err?.response?.status || 500,
			body: this._err?.response?.data
		};
	}

	get request() {
		return {
			body: this._requestBody
		};
	}
}
