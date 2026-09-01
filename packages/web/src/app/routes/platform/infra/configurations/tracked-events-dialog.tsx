import { t } from 'i18next';
import { ExternalLinkIcon, Info, List } from 'lucide-react';

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
        <Button type="button" variant="ghost" size="sm" className="w-fit">
          <List className="size-4" /> {t('See the events we track')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('Events we track')}</DialogTitle>
          <DialogDescription>
            {t(
              'Product analytics sends these events, grouped by where they happen in the product.',
            )}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea viewPortClassName="max-h-[60vh] p-px">
          <div className="flex flex-col gap-6">
            <div className="flex gap-3 rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0" />
              <p>
                {t(
                  'Each event records that the action happened, the account it came from, and your version and environment. Some also carry the id of the project or flow involved, and the step-picker search carries what you typed. We also count page views. Never flow contents, step data, credentials, or anything from your connections.',
                )}
              </p>
            </div>
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
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            {t('Read the telemetry docs')}
            <ExternalLinkIcon className="size-3.5" />
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
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <span className="size-1 shrink-0 rounded-full bg-muted-foreground/60" />
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
