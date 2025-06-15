export interface GenerateChallangeRequest {
    clientId: string;
    domain: string;
}

export interface SignChallangeRequest {
    challenge: string;
    apiKey: string;
}

export interface SubmitChallangeRequest {
    clientId: string;
    domain: string;
    state: string;
    signature: string;
}

export interface SignatureChallenge {
    challenge: string;
    state: string;
}

export interface Auth {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token?: string;
    id_token?: string;
}

export interface ClientCredentials {
    clientId: string;
    domain: string;
    privateKey: string;
    address: string;
}
