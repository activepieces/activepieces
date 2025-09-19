import * as path from 'path'
import { BrowserCheck } from 'checkly/constructs'

new BrowserCheck('signup-check', {
  name: 'Sign Up',
  frequency: 30, // every 30 minutes
  locations: ['eu-west-1'],
  code: {
    entrypoint: path.join(__dirname, 'signup.spec.ts')
  }
})
