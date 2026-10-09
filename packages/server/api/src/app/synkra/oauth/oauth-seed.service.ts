import { FastifyBaseLogger } from 'fastify';
import { oauthAppService } from '../../ee/oauth-apps/oauth-app.service';
import { repoFactory } from '../../core/db/repo-factory';
import { PlatformEntity } from '../../platform/platform.entity';

/**
 * Seeds `oauth_app` rows from `.env` on every boot.
 *
 * Reads OAUTH_<PROVIDER>_CLIENT_ID and OAUTH_<PROVIDER>_CLIENT_SECRET.
 * Registers a row per platform. Idempotent — upsert by (platformId, pieceName).
 *
 * To rotate a secret: edit `.env`, restart the app. Done.
 */
type ProviderSpec = {
  label: string;
  pieceName: string;
  envPrefix: string;
};

const PROVIDERS: ProviderSpec[] = [
  { label: 'Slack',       pieceName: '@activepieces/piece-slack',       envPrefix: 'OAUTH_SLACK' },
  { label: 'Shopify',     pieceName: '@activepieces/piece-shopify',     envPrefix: 'OAUTH_SHOPIFY' },
  { label: 'Zoho CRM',    pieceName: '@activepieces/piece-zoho-crm',    envPrefix: 'OAUTH_ZOHO_CRM' },
  { label: 'Zoho Books',  pieceName: '@activepieces/piece-zoho-books',  envPrefix: 'OAUTH_ZOHO_BOOKS' },
  { label: 'Pipedrive',   pieceName: '@activepieces/piece-pipedrive',   envPrefix: 'OAUTH_PIPEDRIVE' },
  { label: 'ClickUp',     pieceName: '@activepieces/piece-clickup',     envPrefix: 'OAUTH_CLICKUP' },

  // Google — one OAuth client covers all 6 pieces (only non-restricted scopes)
  { label: 'Gmail',            pieceName: '@activepieces/piece-gmail',            envPrefix: 'OAUTH_GOOGLE' },
  { label: 'Google Drive',     pieceName: '@activepieces/piece-google-drive',     envPrefix: 'OAUTH_GOOGLE' },
  { label: 'Google Sheets',    pieceName: '@activepieces/piece-google-sheets',    envPrefix: 'OAUTH_GOOGLE' },
  { label: 'Google Docs',      pieceName: '@activepieces/piece-google-docs',      envPrefix: 'OAUTH_GOOGLE' },
  { label: 'Google Calendar',  pieceName: '@activepieces/piece-google-calendar',  envPrefix: 'OAUTH_GOOGLE' },
  { label: 'Google Forms',     pieceName: '@activepieces/piece-google-forms',     envPrefix: 'OAUTH_GOOGLE' },

  // Second batch
  { label: 'GitHub',          pieceName: '@activepieces/piece-github',          envPrefix: 'OAUTH_GITHUB' },
  { label: 'GitLab',          pieceName: '@activepieces/piece-gitlab',          envPrefix: 'OAUTH_GITLAB' },
  { label: 'Mailchimp',       pieceName: '@activepieces/piece-mailchimp',       envPrefix: 'OAUTH_MAILCHIMP' },
  { label: 'Square',          pieceName: '@activepieces/piece-square',          envPrefix: 'OAUTH_SQUARE' },
];

function readEnv(name: string): string | null {
  const v = process.env[name];
  if (!v) return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

export const synkraOauthSeed = (log: FastifyBaseLogger) => ({
  async seedAll(): Promise<void> {
    let platformIds: string[] = [];
    try {
      const repo = repoFactory<{ id: string }>(PlatformEntity as never);
      const rows = (await repo().find()) as { id: string }[];
      platformIds = rows.map((r) => r.id);
    } catch (err) {
      log.warn({ err }, 'synkra-oauth-seed: could not list platforms');
      return;
    }

    if (platformIds.length === 0) {
      log.info('synkra-oauth-seed: no platforms found, skipping');
      return;
    }

    let seeded = 0;
    let missing = 0;
    let failed = 0;

    for (const spec of PROVIDERS) {
      const clientId = readEnv(`${spec.envPrefix}_CLIENT_ID`);
      const clientSecret = readEnv(`${spec.envPrefix}_CLIENT_SECRET`);

      if (!clientId || !clientSecret) {
        missing++;
        continue;
      }

      for (const platformId of platformIds) {
        try {
          await oauthAppService.upsert({
            platformId,
            request: {
              pieceName: spec.pieceName,
              clientId,
              clientSecret,
            },
          });
          seeded++;
        } catch (err) {
          failed++;
          log.error(
            { err, provider: spec.label, platformId },
            'synkra-oauth-seed: failed to register',
          );
        }
      }
    }

    log.info(
      { seeded, missing, failed, platforms: platformIds.length },
      'synkra-oauth-seed: finished',
    );
  },
});
