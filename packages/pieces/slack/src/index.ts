import { createPiece } from '@activepieces/framework'
import { slackSendDirectMessageAction } from './lib/actions/send-direct-message-action'
import { slackSendMessageAction } from './lib/actions/send-message-action'
import { version } from '../package.json'

export const slack = createPiece({
	name: 'slack',
	displayName: 'Slack',
	logoUrl: 'https://cdn.activepieces.com/pieces/slack.png',
  version,
	actions: [
    slackSendDirectMessageAction,
    slackSendMessageAction,
  ],
	triggers: [
  ]
})
