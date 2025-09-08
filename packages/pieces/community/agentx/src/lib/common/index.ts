import { PieceAuth } from "@activepieces/pieces-framework";

export const agentxAuth = PieceAuth.SecretText({
    displayName: "API Key",
    description: "Get your API key from your AgentX account. Click your avatar in the top right corner to find it.",
    required: true,
});