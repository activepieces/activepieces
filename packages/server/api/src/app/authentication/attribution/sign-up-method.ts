import { SignUpMethod, UserIdentityProvider } from '@activepieces/shared'

function fromProvider({ provider }: { provider: UserIdentityProvider }): SignUpMethod {
    switch (provider) {
        case UserIdentityProvider.EMAIL:
            return SignUpMethod.PASSWORD
        case UserIdentityProvider.GOOGLE:
            return SignUpMethod.GOOGLE
        case UserIdentityProvider.SAML:
            return SignUpMethod.SAML
        case UserIdentityProvider.JWT:
            return SignUpMethod.MANAGED
    }
}

export const signUpMethodUtils = {
    fromProvider,
}
