import { t } from 'i18next';

import { piecesHooks } from '@/features/pieces/hooks/pieces-hooks';
import { cn } from '@/lib/utils';

const TILES_PER_ROW = 36;
const FEATURED_PIECES = [
  'slack',
  'gmail',
  'google-sheets',
  'notion',
  'hubspot',
  'google-drive',
  'openai',
  'github',
  'stripe',
  'shopify',
  'discord',
  'google-calendar',
  'airtable',
  'salesforce',
  'jira-cloud',
  'linear',
  'asana',
  'telegram-bot',
  'twilio',
  'trello',
  'microsoft-teams',
  'mailchimp',
  'intercom',
  'zendesk',
  'clickup',
  'monday',
  'typeform',
  'calendly',
  'dropbox',
  'zoom',
  'todoist',
  'supabase',
  'webflow',
  'square',
].map((name) => `@activepieces/piece-${name}`);

export function IntegrationsBanner() {
  const { pieces } = piecesHooks.usePieces({});
  const withLogos = (pieces ?? []).filter((piece) => piece.logoUrl);
  const byName = new Map(withLogos.map((piece) => [piece.name, piece]));
  const featured = FEATURED_PIECES.map((name) => byName.get(name)).filter(
    (piece) => piece !== undefined,
  );
  const logos = [
    ...featured,
    ...withLogos.filter((piece) => !FEATURED_PIECES.includes(piece.name)),
  ].slice(0, TILES_PER_ROW * 2);

  if (logos.length === 0) {
    return null;
  }

  return (
    <div className="border-t bg-muted/30 pb-9 pt-8">
      <div className="mx-auto w-full max-w-[1198px] flex flex-col gap-6">
        <div className="flex flex-col gap-1.5 px-6 lg:px-14">
          <h2 className="text-[22px] font-bold leading-7 tracking-[-0.02em]">
            {t('Your AI gets all of this')}
          </h2>
          <p className="max-w-[560px] text-sm text-muted-foreground">
            {t(
              'Slack, Gmail, HubSpot, Notion, GitHub and {count}+ more pieces — plus every flow you’ve built, ready to run.',
              { count: Math.floor((pieces?.length ?? 0) / 10) * 10 },
            )}
          </p>
        </div>
        <div className="flex flex-col gap-2.5 overflow-hidden pl-6 [mask-image:linear-gradient(to_right,#000_88%,transparent)] lg:pl-14">
          <TileRow logos={logos.filter((_, index) => index % 2 === 0)} />
          <TileRow
            logos={logos.filter((_, index) => index % 2 === 1)}
            className="pl-8"
          />
        </div>
      </div>
    </div>
  );
}

function TileRow({
  logos,
  className = '',
}: {
  logos: { name: string; displayName: string; logoUrl: string }[];
  className?: string;
}) {
  return (
    <div className={cn('flex gap-2.5', className)}>
      {logos.map((piece) => (
        <span
          key={piece.name}
          title={piece.displayName}
          className="flex size-[62px] shrink-0 items-center justify-center rounded-xl border bg-background"
        >
          <img src={piece.logoUrl} alt={piece.displayName} className="size-8" />
        </span>
      ))}
    </div>
  );
}
