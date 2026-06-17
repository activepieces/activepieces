import { PieceAuth, Property } from '@activepieces/pieces-framework';
import {
  exchangeAppJwtForInstallationToken,
  signGithubAppJwt,
} from './common/auth-helpers';

export const githubOAuth2Auth = PieceAuth.OAuth2({
  description:
    "Authenticate to GitHub. Platform admins can configure this with either OAuth App credentials or GitHub App credentials (Apps use the same authorize/token endpoints — only the client_id differs). When using a GitHub App, the listed scopes are ignored and the App's installation permissions apply instead.",
  required: true,
  authUrl: 'https://github.com/login/oauth/authorize',
  tokenUrl: 'https://github.com/login/oauth/access_token',
  scope: ['admin:repo_hook', 'admin:org', 'repo', 'gist'],
});

export const githubAppAuth = PieceAuth.CustomAuth({
  displayName: 'GitHub App',
  description:
    "Authenticate as a GitHub App installation. Calls are made by the App's bot identity (e.g. `app-name[bot]`). The App must be installed on the target repos with the permissions required by the actions you intend to run (e.g. Issues: Read & write, Contents: Read & write, Administration: Read & write for webhook triggers).",
  required: true,
  props: {
    appId: Property.ShortText({
      displayName: 'App ID or Client ID',
      description:
        'Either the numeric App ID (e.g. `12345`) or the Client ID (e.g. `Iv23li...`) of your GitHub App. The Client ID is recommended for new Apps. Found at Settings → Developer settings → GitHub Apps → your app.',
      required: true,
    }),
    installationId: Property.ShortText({
      displayName: 'Installation ID',
      description:
        'The installation ID for the org/user where the App is installed. Visible in the installation URL: `…/installations/{id}`.',
      required: true,
    }),
    privateKey: PieceAuth.SecretText({
      displayName: 'Private Key',
      description:
        'The PEM-encoded RSA private key generated for your GitHub App (paste the contents of the `.pem` file).',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    const { appId, installationId, privateKey } = auth;
    const jwt = trySignJwt({ appId, privateKey });
    if (!jwt.ok) {
      return { valid: false, error: jwt.error };
    }
    const exchange = await tryExchangeJwt({ jwt: jwt.value, installationId });
    return exchange.ok
      ? { valid: true }
      : { valid: false, error: exchange.error };
  },
});

export const githubAuth = [githubOAuth2Auth, githubAppAuth];

function trySignJwt({
  appId,
  privateKey,
}: {
  appId: string;
  privateKey: string;
}): { ok: true; value: string } | { ok: false; error: string } {
  try {
    return { ok: true, value: signGithubAppJwt({ appId, privateKey }) };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      error: `Could not sign JWT with provided App ID / Client ID and private key: ${message}. Verify the private key is a valid PEM-encoded RSA key.`,
    };
  }
}

async function tryExchangeJwt({
  jwt,
  installationId,
}: {
  jwt: string;
  installationId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await exchangeAppJwtForInstallationToken({ jwt, installationId });
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      error: `Failed to obtain installation token: ${message}. Verify the Installation ID matches an installation of this App.`,
    };
  }
}
