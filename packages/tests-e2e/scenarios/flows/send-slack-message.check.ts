import * as path from 'path'
import { BrowserCheck } from 'checkly/constructs'

new BrowserCheck('send-slack-message-check', {
  name: 'Send Slack Message',
  frequency: 10, // every 10 minutes
  locations: ['eu-west-1'],
  code: {
    entrypoint: path.join(__dirname, 'send-slack-message.spec.ts')
  },
})
