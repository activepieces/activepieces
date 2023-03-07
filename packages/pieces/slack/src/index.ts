import { createPiece } from '@activepieces/framework'
import { slackSendDirectMessageAction } from './lib/actions/send-direct-message-action'
import { slackSendMessageAction } from './lib/actions/send-message-action'
import { version } from '../package.json'
import { EventPayload } from '@activepieces/shared'
import { newMessage as newSlackMessage } from './lib/triggers/new-message'

export const slack = createPiece({
  name: 'slack',
  displayName: 'Slack',
  logoUrl: 'https://cdn.activepieces.com/pieces/slack.png',
  version,
  actions: [
    slackSendDirectMessageAction,
    slackSendMessageAction,
  ],
  events: {
    parseAndReply: ({payload}) => {
      if (payload.body['challenge']) {
        return {
          reply: {
            body: payload.body['challenge'],
            headers: {}
          }
        };
      }
      return { event: payload.body?.event?.type, identifierValue: payload.body.team_id }
    },
    verify: ({webhookSecret, payload}) => {
      return false;
    }
  },
  triggers: [newSlackMessage]
})
