import { t } from 'i18next';
import {
  ArrowRight,
  LucideIcon,
  Plug,
  ScanSearch,
  ShieldCheck,
  Workflow,
} from 'lucide-react';
import * as React from 'react';
import { Link } from 'react-router-dom';

import { StatusDot } from '@/components/custom/status-dot';
import { Card } from '@/components/ui/card';
import { PieceIconWithPieceName } from '@/features/pieces/components/piece-icon-from-name';

import { mcpWorkspaceHooks } from './workspace-examples';

export function WhyConnect() {
  const { flowName, appName, connectedPieceNames } =
    mcpWorkspaceHooks.useExamples();
  const shownPieces = connectedPieceNames.slice(0, MAX_LOGOS);

  return (
    <section
      aria-labelledby="why-connect-title"
      className="flex flex-col gap-4"
    >
      <h2
        id="why-connect-title"
        className="text-base font-semibold text-gray-12"
      >
        {t('Once it is connected, your AI can')}
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ValueCard
          icon={Plug}
          title={t('Work in your apps')}
          body={t(
            'It sends, finds and updates things in the apps this project is already connected to. No API keys go into the chat.',
          )}
        >
          {shownPieces.length > 0 ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1">
                {shownPieces.map((pieceName) => (
                  <PieceIconWithPieceName
                    key={pieceName}
                    pieceName={pieceName}
                    size="xs"
                  />
                ))}
              </span>
              <span className="min-w-0 text-sm text-pretty text-gray-12">
                {connectedPieceNames.length > 1
                  ? t('usesConnectedApps', {
                      app: appName ?? '',
                      count: connectedPieceNames.length - 1,
                    })
                  : t('Uses your {app} connection', { app: appName ?? '' })}
              </span>
            </div>
          ) : (
            <ExampleLine
              text={t('Add a connection once and every AI client can use it.')}
            />
          )}
        </ValueCard>
        <ValueCard
          icon={Workflow}
          title={t('Turn a request into an automation')}
          body={t(
            'Ask for something that should keep happening. It builds the flow, tests it and turns it on, and the flow keeps running after the chat ends.',
          )}
        >
          <ExampleLine
            quote
            text={t('Every morning, send me yesterday’s failed runs.')}
          />
          <ResultLine>
            <StatusDot tone="success">
              {t('Flow built and turned on')}
            </StatusDot>
          </ResultLine>
        </ValueCard>
        <ValueCard
          icon={ScanSearch}
          title={t('Tell you what is running')}
          body={t(
            'It reads your flows and runs, explains what failed and can fix the step that broke.',
          )}
        >
          <ExampleLine
            quote
            text={
              flowName
                ? t('Why did {flow} fail last night?', { flow: flowName })
                : t('Which flows failed this week, and why?')
            }
          />
          <ResultLine>
            <span className="text-sm text-gray-12">
              {t('Reads the run and points to the step')}
            </span>
          </ResultLine>
        </ValueCard>
      </div>
      <ul className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-gray-11">
        <li className="flex items-center gap-2">
          <ShieldCheck aria-hidden className="size-4 text-gray-11" />
          {t('Signs in as you, with your permissions')}
        </li>
        <TrustSeparator />
        <li>{t('Only sees the projects you approve')}</li>
        <TrustSeparator />
        <li>
          <Link
            to="/mcp-server/tools"
            className="text-accent-11 hover:underline"
          >
            {t('You choose what it can change')}
          </Link>
        </li>
        <TrustSeparator />
        <li>
          <Link
            to="/mcp-server/connections"
            className="text-accent-11 hover:underline"
          >
            {t('Revoke it any time')}
          </Link>
        </li>
      </ul>
    </section>
  );
}

function ValueCard({
  icon: Icon,
  title,
  body,
  children,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="gap-4 px-5">
      <div className="flex flex-col gap-3">
        <span className="flex size-8 items-center justify-center rounded-lg bg-accent-3 text-accent-11">
          <Icon aria-hidden className="size-4" />
        </span>
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold text-gray-12">{title}</h3>
          <p className="text-sm text-pretty text-gray-11">{body}</p>
        </div>
      </div>
      <div className="mt-auto flex flex-col gap-2 rounded-xl border bg-gray-2 p-3">
        {children}
      </div>
    </Card>
  );
}

function ExampleLine({
  text,
  quote = false,
}: {
  text: string;
  quote?: boolean;
}) {
  return (
    <p className="text-sm text-pretty text-gray-12">
      {quote ? t('“{text}”', { text }) : text}
    </p>
  );
}

function TrustSeparator() {
  return (
    <li aria-hidden className="text-gray-8">
      ·
    </li>
  );
}

function ResultLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <ArrowRight aria-hidden className="size-3.5 shrink-0 text-gray-9" />
      {children}
    </div>
  );
}

const MAX_LOGOS = 5;
