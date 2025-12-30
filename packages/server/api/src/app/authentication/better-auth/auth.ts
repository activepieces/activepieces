import pg from "pg";
import { passwordHasher } from "../lib/password-hasher";
import { betterAuth } from "better-auth";
import { betterAuthService } from "./better-auth-service";

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
const auth = betterAuth({
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
      sendResetPassword: betterAuthService.sendResetPassword,
      password: {
        hash: passwordHasher.hash,
        verify: (data) => passwordHasher.compare(data.password, data.hash)
      }
    },
    emailVerification: {
      sendVerificationEmail: betterAuthService.sendVerificationEmail,
    }
  });

export default auth;
