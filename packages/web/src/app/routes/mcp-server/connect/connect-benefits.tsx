import { t } from 'i18next';
import {
  Activity,
  Blocks,
  LucideIcon,
  ShieldCheck,
  Workflow,
} from 'lucide-react';

import { PageSection } from '@/components/custom/page';
import { Card } from '@/components/ui/card';

import { useMcpNav } from '../mcp-nav';

export function ConnectBenefits({
  brandName,
  pieceCount,
}: {
  brandName: string;
  pieceCount: number;
}) {
  const nav = useMcpNav();
  const benefits: Benefit[] = [
    {
      icon: Workflow,
      title: t('Build and run flows from a chat'),
      body: t(
        'Ask your AI to build a flow, change a step, test it or publish it. Flows that start with the MCP trigger become tools it can call by name.',
      ),
    },
    {
      icon: Blocks,
      title:
        pieceCount > 0
          ? t('Act in {count} apps', { count: pieceCount })
          : t('Act in your apps'),
      body: t(
        'Your AI can run any piece action, like sending a Slack message or updating a CRM record, through the connections you already have.',
      ),
    },
    {
      icon: ShieldCheck,
      title: t('Your permissions still apply'),
      body: t(
        'Clients sign in with OAuth and act as you, with your role in each project. Admins choose which tools are on.',
      ),
    },
    {
      icon: Activity,
      title: t('See every action'),
      body: t(
        'Every piece action a client runs is logged in Activity, with who ran it, its input and its result.',
      ),
      onClick: () => nav.showTab('activity'),
    },
  ];

  return (
    <PageSection
      title={t('What your AI can do with {brand}', { brand: brandName })}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {benefits.map((benefit) => (
          <BenefitCard key={benefit.title} benefit={benefit} />
        ))}
      </div>
    </PageSection>
  );
}

function BenefitCard({ benefit }: { benefit: Benefit }) {
  const Icon = benefit.icon;
  return (
    <Card className="gap-3 px-4">
      <span className="flex size-8 items-center justify-center rounded-lg bg-accent-3 text-accent-11">
        <Icon className="size-4" />
      </span>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-gray-12">
          {benefit.title}
        </span>
        <p className="text-sm text-gray-11">{benefit.body}</p>
      </div>
      {benefit.onClick && (
        <button
          type="button"
          onClick={benefit.onClick}
          className="mt-auto w-fit text-sm font-medium text-accent-11 underline-offset-4 hover:underline"
        >
          {t('Open Activity')}
        </button>
      )}
    </Card>
  );
}

type Benefit = {
  icon: LucideIcon;
  title: string;
  body: string;
  onClick?: () => void;
};
