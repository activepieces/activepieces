/**
 * Bridge between Activepieces auth and hulymcp Effect operations.
 *
 * Creates a HulyClient from auth fields, runs an Effect operation,
 * and tears down the connection.
 */
import "@hulymcp/polyfills.js";

import { Effect, Layer, Redacted } from "effect";

import { HulyConfigService } from "@hulymcp/config/config.js";
import { HulyClient } from "@hulymcp/huly/client.js";

export interface HulyAuth {
  url: string;
  workspace: string;
  token?: string;
  email?: string;
  password?: string;
}

/**
 * Run an Effect operation that requires HulyClient.
 * Builds layers from auth fields, executes, tears down.
 *
 * Supports both token auth (preferred) and email+password.
 *
 * Effect.scoped manages the scope — when the operation completes,
 * the scope closes and HulyClient finalizers (connection teardown) run.
 *
 * Typed errors from operations are caught and converted to thrown Errors
 * so Activepieces gets clean error messages instead of fiber failure traces.
 */
export async function withHulyClient<T>(
  auth: HulyAuth,
  operation: Effect.Effect<T, unknown, HulyClient>
): Promise<T> {
  if (!auth.token && (!auth.email || !auth.password)) {
    throw new Error("Provide either an API token, or both email and password.");
  }

  const authConfig = auth.token
    ? { _tag: "token" as const, token: Redacted.make(auth.token) }
    : { _tag: "password" as const, email: auth.email ?? "", password: Redacted.make(auth.password ?? "") };

  const configLayer = Layer.succeed(HulyConfigService, {
    url: auth.url,
    auth: authConfig,
    workspace: auth.workspace,
    connectionTimeout: 30000,
  });

  const clientLayer = HulyClient.layer.pipe(Layer.provide(configLayer));

  return Effect.runPromise(
    operation.pipe(
      Effect.catchAll((e) =>
        Effect.fail(new Error(
          e instanceof Error ? e.message
            : typeof e === "object" && e !== null && "_tag" in e
              ? `${(e as { _tag: string })._tag}: ${"message" in e ? (e as { message: string }).message : JSON.stringify(e)}`
              : String(e)
        ))
      ),
      Effect.provide(clientLayer),
      Effect.scoped,
    )
  );
}
