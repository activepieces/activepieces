import pg from "pg";
import { passwordHasher } from "../lib/password-hasher";
import { betterAuth } from "better-auth";
import { betterAuthService } from "./better-auth-service";
import { createAuthMiddleware } from "better-auth/api";
import { UserIdentityProvider } from "@activepieces/shared";
import { nanoid } from "nanoid";
import { system } from "../../helper/system/system";
import { cryptoUtils } from "@activepieces/server-shared";

function getEnvOrThrow(key: string): string {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`)
  }
  return value
}

function getConnectionString(): string {
  const url = process.env["AP_POSTGRES_URL"]

  if (url) {
      return url;
  }

  const database = getEnvOrThrow("AP_POSTGRES_DATABASE")
  const host = getEnvOrThrow("AP_POSTGRES_HOST")
  const password = getEnvOrThrow("AP_POSTGRES_PASSWORD")
  const serializedPort = getEnvOrThrow("AP_POSTGRES_PORT")
  const port = Number.parseInt(serializedPort, 10)
  const username = getEnvOrThrow("AP_POSTGRES_USERNAME")

  if (!username || !password || !database) {
    throw new Error('Missing required database connection properties');
  }
  // URL encode password to handle special characters
  const encodedPassword = encodeURIComponent(password);
  
  return `postgresql://${username}:${encodedPassword}@${host}:${port}/${database}`;
}

const { Pool } = pg;

const service = betterAuthService(system.globalLogger())
const auth = betterAuth({
    basePath: "/v1/better-auth",
    database: new Pool({
      connectionString: getConnectionString(),
    }),
    user: {
      modelName: "user_identity",
      additionalFields: {
        firstName: {
          type: "string",
          returned: true,
          required: true,
          input: true,
        },
        lastName: {
          type: "string",
          returned: true,
          required: true,
          input: true,
        },
        provider: {
          type: "string",
          returned: true,
          required: true,
          input: true,
        },
        trackEvents: {
          type: "boolean",
          returned: true,
        },
        newsLetter: {
          type: "boolean",
          returned: true,
        },
        tokenVersion: {
          type: "string",
          returned: true,
        },
      }
    },
    emailAndPassword: {    
      enabled: true,
      requireEmailVerification: true,
      sendResetPassword: service.sendResetPassword,
      password: {
        hash: passwordHasher.hash,
        verify: (data) => passwordHasher.compare(data.password, data.hash)
      }
    },
    emailVerification: {
      sendVerificationEmail: service.sendVerificationEmail,
    },
    socialProviders: {
      google: {
        clientId: getEnvOrThrow("AP_GOOGLE_CLIENT_ID"),
        clientSecret: getEnvOrThrow("AP_GOOGLE_CLIENT_SECRET"),

        mapProfileToUser: async (profile) => {
          return {
            ...profile,
            firstName: profile.given_name ?? 'john',
            lastName: profile.family_name ?? 'doe',
            trackEvents: true,
            newsLetter: true,
            provider: UserIdentityProvider.GOOGLE,
            tokenVersion: nanoid(),
            password: await cryptoUtils.generateRandomPassword(),
            draft: true
          }
        }
      }
    },
    trustedOrigins: ["*"],
     hooks: {
        after: createAuthMiddleware(service.afterHook),  
    },
  });

export default auth;
