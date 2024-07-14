import { api } from "@/lib/api";
import { AuthenticationResponse, FederatedAuthnLoginResponse, SignInRequest, ThirdPartyAuthnProviderEnum } from "@activepieces/shared";

export const authenticationApi = {
    signIn(request: SignInRequest) {
        return api.post<AuthenticationResponse>('/v1/authentication/sign-in', request);
    },
    getFederatedAuthLoginUrl(providerName: ThirdPartyAuthnProviderEnum) {
        return api.get<FederatedAuthnLoginResponse>(`/v1/authn/federated/login`, {
            providerName
        });
    }
}