import * as path from 'path'
import { BrowserCheck } from 'checkly/constructs'

new BrowserCheck('signin-check', {
  name: 'Sign In',
  frequency: 30, // every 30 minutes
  locations: ['eu-west-1'],
  code: {
    entrypoint: path.join(__dirname, 'signin.spec.ts')
  }
})
