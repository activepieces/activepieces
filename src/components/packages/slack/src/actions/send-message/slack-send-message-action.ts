import {Action} from '@activepieces/components-framework';
import type {Runner} from '@activepieces/components-framework';
import type {Configuration} from '@activepieces/components-framework';
import {slackSendMessageConfig} from './slack-send-message-config';
import {SlackSendMessageRunner} from './slack-send-message-runner';

export class SlackSendMessageAction extends Action {
	constructor(
		config: Configuration = slackSendMessageConfig,
		runner: Runner = new SlackSendMessageRunner(),
	) {
		super(config, runner);
	}
}
