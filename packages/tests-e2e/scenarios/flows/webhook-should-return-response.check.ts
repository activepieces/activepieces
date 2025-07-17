import * as path from 'path'
import { BrowserCheck } from 'checkly/constructs'

new BrowserCheck('webhook-should-return-response-check', {
  name: 'Webhook Should Return Response',
  frequency: 30, // every 30 minutes
  locations: ['eu-west-1'],
  code: {
    entrypoint: path.join(__dirname, 'webhook-should-return-response.spec.ts')
  }
})
