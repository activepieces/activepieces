import { AuthenticationResponse, assertNotNullOrUndefined } from "@activepieces/shared";

export const authenticationSession = {
    saveResponse(response: AuthenticationResponse) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('currentUser', JSON.stringify(response));
    },
    getToken(): string | null {
        return localStorage.getItem('token') ?? null;
    },
    getProjectId(): string  {
        assertNotNullOrUndefined(this.getToken(), 'Token is not defined');
        const currentUser = JSON.parse(localStorage.getItem('currentUser')!);
        return currentUser.projectId;
    },
    isLoggedIn(): boolean {
        return !!this.getToken();
    }
}