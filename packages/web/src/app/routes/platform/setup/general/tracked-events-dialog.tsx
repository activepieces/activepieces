import { t } from 'i18next';
import { ExternalLink } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

import {
  trackedEventsCatalog,
  TrackedEventGroup,
} from './tracked-events-catalog';

const TELEMETRY_DOCS_URL =
  'https://www.activepieces.com/docs/install/configure-operate/telemetry';

export const TrackedEventsDialog = () => {
  const groups = trackedEventsCatalog.buildGroups();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="sm">
          {t('See the events we track')}
        </Button>
      </DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{t('Events we track')}</DialogTitle>
          <DialogDescription>
            {t(
              'Product analytics records that these happened, and by whom. Never the data inside them.',
            )}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea viewPortClassName="max-h-[60vh] p-px">
          <div className="flex flex-col gap-6">
            {groups.map((group) => (
              <TrackedEventGroupSection key={group.id} group={group} />
            ))}
          </div>
        </ScrollArea>
        <DialogFooter
          className="items-center sm:justify-between"
          showCloseButton
        >
          <a
            href={TELEMETRY_DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-gray-11 underline-offset-4 hover:text-gray-12 hover:underline"
          >
            {t('Read the docs')}
            <ExternalLink className="size-4" />
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const TrackedEventGroupSection = ({ group }: TrackedEventGroupSectionProps) => {
  const Icon = group.icon;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Icon className="size-4" />
        <h3 className="text-sm font-semibold">{group.title}</h3>
      </div>
      <ul className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
        {group.labels.map((label) => (
          <li
            key={label}
            className="flex items-center gap-2 text-sm text-gray-11"
          >
            <span className="size-1 shrink-0 rounded-full bg-gray-9" />
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
};

type TrackedEventGroupSectionProps = {
  group: TrackedEventGroup;
};
