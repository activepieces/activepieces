import type {ConfigurationValue} from '@activepieces/components-framework';
import type {RunnerStatus} from '@activepieces/components-framework';
import type {Runner} from '@activepieces/components-framework';
import type {HttpClient} from '@activepieces/components-common';
import {SuperAgentHttpClient} from '@activepieces/components-common';
import type {HttpRequest} from '@activepieces/components-common';
import {HttpMethod} from '@activepieces/components-common';
import {AuthenticationType} from '@activepieces/components-common';

export class SlackSendMessageRunner implements Runner {
	constructor(
		private readonly httpClient: HttpClient = new SuperAgentHttpClient('https://slack.com/api'),
	) {}

	async execute(configValue: ConfigurationValue): Promise<RunnerStatus> {
		const request: HttpRequest<Record<string, string>> = {
			method: HttpMethod.POST,
			url: '/chat.postMessage',
			body: configValue.inputs,
			authentication: {
				type: AuthenticationType.BEARER_TOKEN,
				token: configValue.authentication.accessToken,
			},
			queryParams: {},
		};

		await this.httpClient.sendRequest(request);

		return {
			success: true,
		};
	}
}
