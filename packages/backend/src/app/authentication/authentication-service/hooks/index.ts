import { AuthenticationServiceHooks } from './authentication-service-hooks'
import { defaultAuthenticationServiceHooks } from './default-authentication-service-hooks'

let hooks = defaultAuthenticationServiceHooks

export const authenticationServiceHooks = {
    set(newHooks: AuthenticationServiceHooks): void {
        hooks = newHooks
    },

    get(): AuthenticationServiceHooks {
        return hooks
    },
}
