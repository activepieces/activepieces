import { api } from "@/lib/api";
import { AuthenticationResponse, SignInRequest } from "@activepieces/shared";

export const authenticationApi = {
    signIn(request: SignInRequest) {
        return api.post<AuthenticationResponse>('/v1/authentication/sign-in', request);
    },
}