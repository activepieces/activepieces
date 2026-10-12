import { t } from 'i18next';
import { ArrowRight, ExternalLink, Plug } from 'lucide-react';
import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { piecesHooks } from '@/features/pieces';

/**
 * Step 4 — Connect your tools.
 *
 * Shows pieces relevant to the user's selected use cases. Every card
 * has a Connect button that opens the same flow the main Integrations
 * page uses. Skippable — some users want to look around first.
 */
const USE_CASE_TO_CATEGORIES: Record<string, string[]> = {
  sales: ['SALES_AND_MARKETING', 'COMMUNICATION'],
  marketing: ['SALES_AND_MARKETING', 'COMMUNICATION'],
  ecommerce: ['COMMERCE', 'PAYMENT_PROCESSING', 'SUPPLY_CHAIN'],
  operations: ['PRODUCTIVITY', 'COMMUNICATION'],
  data: ['PRODUCTIVITY', 'FILES_AND_DOCUMENTS'],
  ai: ['ARTIFICIAL_INTELLIGENCE'],
};

const PRIORITISED: Record<string, string[]> = {
  sales: ['@activepieces/piece-hubspot', '@activepieces/piece-pipedrive', '@activepieces/piece-zoho-crm'],
  marketing: ['@activepieces/piece-slack', '@activepieces/piece-mailchimp'],
  ecommerce: ['@activepieces/piece-shopify', '@activepieces/piece-woocommerce', '@synkra/piece-payfast', '@synkra/piece-yoco'],
  operations: ['@activepieces/piece-slack', '@activepieces/piece-google-sheets', '@activepieces/piece-gmail'],
  data: ['@activepieces/piece-google-sheets', '@activepieces/piece-airtable', '@activepieces/piece-http'],
  ai: ['@activepieces/piece-openai', '@activepieces/piece-claude', '@activepieces/piece-google-gemini'],
};

export function ConnectToolsStep({
  useCases,
  onNext,
  onSkip,
}: {
  useCases: string[];
  onNext: () => void;
  onSkip: () => void;
}) {
  const { pieces, isLoading } = piecesHooks.usePieces({});

  const recommended = useMemo(() => {
    const all = pieces ?? [];
    // Collect preferred piece names for the selected use cases.
    const preferred = new Set<string>();
    for (const uc of useCases) {
      for (const name of PRIORITISED[uc] ?? []) preferred.add(name);
    }
    // Fallback: if no use cases selected, pick first 6 by category.
    if (preferred.size === 0) {
      return all.slice(0, 6);
    }
    return all.filter((p) => preferred.has(p.name)).slice(0, 8);
  }, [pieces, useCases]);

  return (
    <div className="flex flex-col max-w-4xl mx-auto gap-6 py-8">
      <div>
        <h2 className="text-2xl font-semibold">{t('Connect your tools')}</h2>
        <p className="text-sm text-gray-11 mt-2">
          {t(
            'Connect the apps you already use. You can skip this and connect later — nothing breaks.',
          )}
        </p>
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-11 py-8 text-center">
          {t('Loading integrations…')}
        </div>
      ) : recommended.length === 0 ? (
        <div className="rounded-lg border bg-white p-8 text-center">
          <Plug className="h-8 w-8 mx-auto text-gray-8 mb-3" />
          <div className="font-medium">
            {t('No recommendations yet')}
          </div>
          <p className="text-sm text-gray-11 mt-1">
            {t(
              'Pick a use case in the previous step and we will show you relevant integrations.',
            )}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {recommended.map((p) => (
            <div
              key={p.name}
              className="rounded-lg border bg-white p-4 flex items-center gap-3"
            >
              <div className="size-9 rounded border flex items-center justify-center bg-gray-2 shrink-0">
                {p.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.logoUrl}
                    alt=""
                    className="size-7 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <Plug className="h-4 w-4 text-gray-11" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">
                  {p.displayName}
                </div>
                <div className="text-xs text-gray-11 truncate">
                  {p.description ?? ''}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  window.open('/integrations', '_blank');
                }}
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1" />
                {t('Connect')}
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={onSkip}>
          {t('Skip and continue')}
        </Button>
        <Button onClick={onNext} className="gap-2">
          {t('Continue')}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
