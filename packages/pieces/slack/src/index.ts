import { createPiece } from '@activepieces/framework'
import { slackSendDirectMessageAction } from './lib/actions/send-direct-message-action'
import { slackSendMessageAction } from './lib/actions/send-message-action'

export const slack = createPiece({
	name: 'slack',
	displayName: 'Slack',
	logoUrl: 'https://cdn.activepieces.com/pieces/slack.png',
	actions: [
    slackSendDirectMessageAction,
    slackSendMessageAction,
  ],
	triggers: [
  ]
})
