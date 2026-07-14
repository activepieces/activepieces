import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { useStage } from '../workspace-shell/stage-context';
import { useProjectNavItems } from '../workspace-shell/use-project-nav-items';

import { useHoverOpenPopover } from './use-hover-open-popover';

// The header's section title: opens a quick-navigation menu with the project
// pages — on hover it closes when the pointer leaves, a click pins it open.
// Navigation goes through the Stage so a docked chat (?chat=) survives.
export function SectionNavMenu({ label }: SectionNavMenuProps) {
  const { open: openStage } = useStage();
  const items = useProjectNavItems();
  const {
    open,
    handleHoverEnter,
    handleHoverLeave,
    handleOpenChange,
    keepOpenOnClick,
    close,
  } = useHoverOpenPopover();

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="pointer-events-auto h-auto shrink-0 rounded-md px-1.5 py-1 text-sm font-medium"
          onMouseEnter={handleHoverEnter}
          onMouseLeave={handleHoverLeave}
          onClick={keepOpenOnClick}
        >
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="pointer-events-auto w-48 p-1"
        align="start"
        onMouseEnter={handleHoverEnter}
        onMouseLeave={handleHoverLeave}
      >
        {items.map(({ key, label: itemLabel, Icon, resource }) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              close();
              openStage(resource);
            }}
            className="flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted"
          >
            <Icon className="size-4 shrink-0" size={16} />
            {itemLabel}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

type SectionNavMenuProps = {
  label: string;
};
