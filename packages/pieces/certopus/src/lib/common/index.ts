import { Property } from "@activepieces/pieces-framework";
import { CertopusClient } from "./client";

export function makeClient(apiKey: string): CertopusClient {
    return new CertopusClient(
        apiKey
    )
}

export const certopusCommon = {
    baseUrl: "https://api.certopus.com/v1",
    authentication: Property.SecretText({
        displayName: "API Key",
        required: true,
        description: "API key acquired from your Certopus profile"
    }),
}
