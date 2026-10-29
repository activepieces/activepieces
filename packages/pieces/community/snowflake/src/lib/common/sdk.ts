import type * as SnowflakeSdk from 'snowflake-sdk';

let sdkPromise: Promise<SnowflakeModule> | undefined;

export function loadSnowflakeSdk(): Promise<SnowflakeModule> {
  if (!sdkPromise) {
    sdkPromise = import('snowflake-sdk')
      .then((mod) => {
        const sdk = pickSdk(mod);
        sdk.configure({ logLevel: 'ERROR' });
        return sdk;
      })
      .catch((error: unknown) => {
        sdkPromise = undefined;
        throw error;
      });
  }
  return sdkPromise;
}

function pickSdk(
  mod: SnowflakeModule | { default: SnowflakeModule }
): SnowflakeModule {
  return isWrapped(mod) ? mod.default : mod;
}

function isWrapped(
  mod: SnowflakeModule | { default: SnowflakeModule }
): mod is { default: SnowflakeModule } {
  return (
    !('createConnection' in mod) || typeof mod.createConnection !== 'function'
  );
}

export type SnowflakeModule = typeof SnowflakeSdk;
