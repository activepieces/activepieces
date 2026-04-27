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
 * Extract flat auth props from AP connection value or pass through if already flat.
 * In action run() and dropdown options(), auth arrives as { type: "CUSTOM_AUTH", props: { url, ... } }.
 * In validate(), AP unwraps it to just the props object { url, ... }.
 */
function extractAuth(auth: unknown): HulyAuth {
  if (typeof auth === "object" && auth !== null && "props" in auth) {
    return (auth as { props: HulyAuth }).props;
  }
  return auth as HulyAuth;
}

/**
 * Run an Effect operation that requires HulyClient.
 * Builds layers from auth fields, executes, tears down.
 *
 * Accepts both the raw props object ({ url, workspace, ... }) and
 * the AP connection wrapper ({ type: "CUSTOM_AUTH", props: { ... } }).
 *
 * Effect.scoped manages the scope — when the operation completes,
 * the scope closes and HulyClient finalizers (connection teardown) run.
 *
 * Typed errors from operations are caught and converted to thrown Errors
 * so Activepieces gets clean error messages instead of fiber failure traces.
 */
export async function withHulyClient<T>(
  rawAuth: unknown,
  operation: Effect.Effect<T, unknown, HulyClient>
): Promise<T> {
  const auth = extractAuth(rawAuth);
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
