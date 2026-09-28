import {
  LeftToRightListBulletIcon,
  LinkSquare02Icon,
} from '@hugeicons/core-free-icons';
import { t } from 'i18next';

import { HugeiconsIcon } from '@/components/custom/hugeicons-icon';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
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
          <HugeiconsIcon icon={LeftToRightListBulletIcon} className="size-4" />{' '}
          {t('See the events we track')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('Events we track')}</DialogTitle>
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
            {t('Read the telemetry docs')}
            <HugeiconsIcon icon={LinkSquare02Icon} className="size-3.5" />
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
        <HugeiconsIcon icon={Icon} className="size-4" />
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
