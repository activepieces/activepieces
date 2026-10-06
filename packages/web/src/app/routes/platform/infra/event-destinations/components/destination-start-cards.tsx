import { Pulse01Icon, WorkflowSquare02Icon } from '@hugeicons/core-free-icons';
import { t } from 'i18next';
import { Link } from 'react-router-dom';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

import {
  DESTINATION_KIND_SEARCH_PARAM,
  DestinationKind,
} from '../lib/destination-kinds';
import { EVENT_STREAMING_PATH } from '../lib/event-streaming-path';

import { VendorLogoStack } from './vendor-logo-stack';

export const DestinationStartCards = () => {
  return (
    <div className="grid w-full grid-cols-1 gap-3 text-left sm:grid-cols-2">
      <StartCard
        to={newDestinationPath('otel')}
        icon={<HugeiconsIcon icon={Pulse01Icon} className="size-4" />}
        isPrimary={true}
        title={t('Send to an OpenTelemetry tool')}
        description={t(
          "Paste your tool's OTLP logs URL. Each event arrives as a log record.",
        )}
      >
        <VendorLogoStack />
      </StartCard>
      <StartCard
        to={newDestinationPath('webhook')}
        icon={<HugeiconsIcon icon={WorkflowSquare02Icon} className="size-4" />}
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
      {...adminControl(AdminControl.EVENT_DESTINATIONS_DESTINATION_NEW_OPEN)}
      to={to}
      className="flex gap-3 rounded-xl border bg-panel p-4 transition-colors hover:bg-gray-3"
    >
      <span
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-md',
          isPrimary ? 'bg-accent-3 text-accent-11' : 'bg-gray-3 text-gray-11',
        )}
      >
        {icon}
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-sm font-medium text-gray-12">{title}</span>
        <span className="text-sm leading-normal text-gray-11">
          {description}
        </span>
        {children}
      </div>
    </Link>
  );
};

function newDestinationPath(kind: DestinationKind): string {
  return `${EVENT_STREAMING_PATH}/new?${DESTINATION_KIND_SEARCH_PARAM}=${kind}`;
}
