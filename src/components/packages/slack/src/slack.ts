import type {Action} from '@activepieces/components-framework';
import type {ConfigurationValue} from '@activepieces/components-framework';
import {SlackSendMessageAction} from './actions/send-message/slack-send-message-action';

export class Slack {
	constructor(
		private readonly sendMessageAction: Action = new SlackSendMessageAction(),
	) {}

	async sendMessage(configValue: ConfigurationValue): Promise<void> {
		await this.sendMessageAction.run(configValue);
	}
}
