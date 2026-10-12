import { birdHttpClient } from "./common/http";
import {
  AppConnectionType,
  OAuth2AuthorizationMethod,
  PieceAuth,
} from "@activepieces/pieces-framework";
import {
  credentialForAuth,
  executeOperation,
  regionForCredential,
} from "./common/request";
import { isRecord } from "./common/values";
import definitions from "../../generated/operations.json";

const workspace = { path: "/v1/workspace", method: "GET", fields: [] };

async function validateConnection(auth: unknown) {
  try {
    await executeOperation(workspace, {
      accessToken: credentialForAuth(auth),
      httpClient: birdHttpClient,
    });
    return { valid: true as const };
  } catch (error) {
    return {
      valid: false as const,
      error:
        error instanceof Error
          ? error.message
          : "Bird could not validate this connection.",
    };
  }
}

async function connectionIdentifier(auth: unknown) {
  try {
    const credential = credentialForAuth(auth);
    const result = await executeOperation(workspace, {
      accessToken: credential,
      httpClient: birdHttpClient,
    });
    const region = regionForCredential(credential);
    return isRecord(result) &&
      typeof result["name"] === "string" &&
      result["name"].trim()
      ? `${result["name"]} · ${region}`
      : `Bird · ${region}`;
  } catch {
    return undefined;
  }
}

const birdOAuth = PieceAuth.OAuth2({
  displayName: "Bird OAuth",
  description:
    "Authorize your Bird workspace for email, SMS, WhatsApp and Verify.",
  authUrl: "https://platform.bird.com/v1/oauth/authorize",
  tokenUrl: "https://platform.bird.com/v1/oauth/token",
  scope: definitions.scopes,
  pkce: true,
  pkceMethod: "S256",
  authorizationMethod: OAuth2AuthorizationMethod.BODY,
  prompt: "omit",
  required: true,
  validate: ({ auth }) => validateConnection(auth),
  getConnectionIdentifier: ({ auth }) => connectionIdentifier(auth),
});

const birdAccessKey = PieceAuth.SecretText({
  displayName: "Bird Access Key",
  description: `Create an access key for your Bird workspace following the [API authentication guide](https://bird.com/docs/api/authentication). Grant workspace:read for connection validation and permissions needed by your actions: ${definitions.scopes.filter((scope) => scope !== "workspace:read").join(", ")}. Copy the key starting with bk_eu1_ or bk_us1_ into this field. For legacy Channels API connections, choose Legacy MessageBird.`,
  required: true,
  validate: ({ auth }) =>
    validateConnection({
      type: AppConnectionType.SECRET_TEXT,
      secret_text: auth,
    }),
  getConnectionIdentifier: ({ auth }) =>
    connectionIdentifier({
      type: AppConnectionType.SECRET_TEXT,
      secret_text: auth,
    }),
});

const legacyMessageBird = PieceAuth.CustomAuth({
  displayName: "Legacy MessageBird",
  description:
    "Use with actions pinned to MessageBird 0.3.x. For current Bird actions, choose Bird OAuth or Bird Access Key.",
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: "API Key",
      description: "Bird API Access Key from Settings > Security > Access Keys",
      required: true,
    }),
    workspaceId: PieceAuth.SecretText({
      displayName: "Workspace ID",
      description: "Bird Workspace ID found in your workspace URL",
      required: true,
    }),
    channelId: PieceAuth.SecretText({
      displayName: "Channel ID",
      description: "Your SMS channel ID from Bird dashboard",
      required: true,
    }),
  },
  required: true,
});

export const birdAuth = [birdOAuth, birdAccessKey, legacyMessageBird];
