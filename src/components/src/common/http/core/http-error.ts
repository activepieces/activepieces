export class HttpError extends Error {
	constructor(
		public readonly url: string,
	) {
		super(`HTTP request failed: ${url}`);
	}
}
