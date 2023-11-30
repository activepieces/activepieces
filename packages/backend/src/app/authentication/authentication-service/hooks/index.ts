import { AuthenticationServiceHooks } from './authentication-service-hooks'
import { communityAuthenticationServiceHooks } from './community-service-hooks'

let hooks = communityAuthenticationServiceHooks

export const authenticationServiceHooks = {
    set(newHooks: AuthenticationServiceHooks): void {
        hooks = newHooks
    },

    get(): AuthenticationServiceHooks {
        return hooks
    },
}
