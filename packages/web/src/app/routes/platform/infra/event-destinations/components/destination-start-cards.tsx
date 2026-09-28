import { t } from 'i18next';
import { Activity, Workflow } from 'lucide-react';
import { Link } from 'react-router-dom';

import { cn } from '@/lib/utils';

import {
  DESTINATION_KIND_SEARCH_PARAM,
  DestinationKind,
} from '../lib/destination-kinds';

import { VendorLogoStack } from './vendor-logo-stack';

export const DestinationStartCards = ({ formPath }: { formPath: string }) => {
  return (
    <div className="mb-10 mt-4 grid w-full max-w-[640px] grid-cols-2 gap-3 text-left">
      <StartCard
        to={newDestinationPath({ formPath, kind: 'otel' })}
        icon={<Activity className="size-4" />}
        isPrimary={true}
        title={t('Send to an OpenTelemetry tool')}
        description={t(
          "Paste your tool's OTLP logs URL. Each event arrives as a log record.",
        )}
      >
        <VendorLogoStack />
      </StartCard>
      <StartCard
        to={newDestinationPath({ formPath, kind: 'webhook' })}
        icon={<Workflow className="size-4" />}
        isPrimary={false}
        title={t('Handle events in a flow')}
        description={t(
          'Generate a webhook flow that routes each event to Slack, Gmail, or any app.',
        )}
      />
    </div>
  );
};

const StartCard = ({
  to,
  icon,
  isPrimary,
  title,
  description,
  children,
}: {
  to: string;
  icon: React.ReactNode;
  isPrimary: boolean;
  title: string;
  description: string;
  children?: React.ReactNode;
}) => {
  return (
    <Link
      to={to}
      className="flex gap-3 rounded-lg border p-4 transition-colors hover:bg-accent"
    >
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-md',
          isPrimary ? 'bg-primary/10 text-primary' : 'bg-muted text-foreground',
        )}
      >
        {icon}
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-sm leading-normal text-muted-foreground">
          {description}
        </span>
        {children}
      </div>
    </Link>
  );
};

function newDestinationPath({
  formPath,
  kind,
}: {
  formPath: string;
  kind: DestinationKind;
}): string {
  return `${formPath}/new?${DESTINATION_KIND_SEARCH_PARAM}=${kind}`;
}
