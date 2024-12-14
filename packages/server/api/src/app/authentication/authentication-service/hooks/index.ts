import { hooksFactory } from '../../../helper/hooks-factory'
import { AuthenticationServiceHooks } from './authentication-service-hooks'
import { communityAuthenticationServiceHooks } from './community-authentication-hooks'

export const authenticationServiceHooks = hooksFactory.create<AuthenticationServiceHooks>(communityAuthenticationServiceHooks)
