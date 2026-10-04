import { t } from 'i18next';
import { ArrowDown, ArrowRight, Check } from 'lucide-react';

import { LogoPlate } from '@/components/custom/logo-plate';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { MCP_CLIENT_BRANDING } from '../mcp-client-display';

export function ConnectHero({
  brandName,
  onConnect,
}: {
  brandName: string;
  onConnect: () => void;
}) {
  return (
    <section className="grid grid-cols-1 items-center gap-8 py-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,27rem)] lg:gap-12">
      <div className="flex min-w-0 flex-col gap-5">
        <h2 className="text-2xl font-semibold tracking-tight text-balance text-gray-12">
          {t('Ask your AI. It builds the flow and runs it.')}
        </h2>
        <p className="max-w-xl text-base text-pretty text-gray-11">
          {t(
            'Connect Claude, ChatGPT, Cursor or any MCP client to {brand} once. Then describe what you need in plain words, and it builds flows, runs them and acts in your apps, signed in as you.',
            { brand: brandName },
          )}
        </p>
        <ul className="flex flex-col gap-2 text-sm text-gray-12">
          {[
            t('No API keys. Sign in once with your account.'),
            t('Only the projects and tools you allow.'),
            t('Every action it takes is logged.'),
          ].map((point) => (
            <li key={point} className="flex items-center gap-2">
              <Check className="size-4 shrink-0 text-success-11" />
              {point}
            </li>
          ))}
        </ul>
        <div>
          <Button size="lg" onClick={onConnect}>
            {t('Connect your AI')}
            <ArrowDown />
          </Button>
        </div>
      </div>
      <ChatExample brandName={brandName} />
    </section>
  );
}

function ChatExample({ brandName }: { brandName: string }) {
  return (
    <Card
      aria-label={t('Example conversation')}
      className="gap-4 p-5 shadow-over"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gray-3 text-xs font-medium text-gray-11">
          {t('You')}
        </span>
        <p className="rounded-xl rounded-tl-md bg-gray-3 px-3 py-2 text-sm text-gray-12">
          {t(
            'Every Monday at 9, post last week’s Stripe refunds to #finance in Slack.',
          )}
        </p>
      </div>
      <div className="flex items-start gap-3">
        <LogoPlate
          src={MCP_CLIENT_BRANDING.claude.icon}
          alt=""
          size="sm"
          border
          className="mt-0.5 rounded-full"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <p className="text-sm text-gray-12">
            {t('Done. I built the flow in {brand} and turned it on.', {
              brand: brandName,
            })}
          </p>
          <div className="flex flex-col gap-3 rounded-xl border bg-panel p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium text-gray-12">
                {t('Weekly refunds to Slack')}
              </span>
              <span className="flex shrink-0 items-center gap-1.5 text-xs text-success-11">
                <span className="size-1.5 rounded-full bg-success-11" />
                {t('On')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {FLOW_STEPS.map((step, index) => (
                <span key={step.name} className="flex items-center gap-2">
                  {index > 0 && (
                    <ArrowRight className="size-3.5 shrink-0 text-gray-9" />
                  )}
                  <span className="flex items-center gap-1.5 rounded-lg border bg-gray-1 py-1 pr-2 pl-1">
                    <LogoPlate src={step.logo} alt="" size="xs" />
                    <span className="text-xs text-gray-12">{t(step.name)}</span>
                  </span>
                </span>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-11">
            {t('Used your Stripe and Slack connections. Runs as you.')}
          </p>
        </div>
      </div>
    </Card>
  );
}

const FLOW_STEPS = [
  {
    name: 'Schedule',
    logo: 'https://cdn.activepieces.com/pieces/schedule.png',
  },
  { name: 'Stripe', logo: 'https://cdn.activepieces.com/pieces/stripe.png' },
  { name: 'Slack', logo: 'https://cdn.activepieces.com/pieces/slack.png' },
];
