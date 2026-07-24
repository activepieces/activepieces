import { t } from 'i18next';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function RememberedFacts({
  memories,
  onForget,
}: {
  memories: string[];
  onForget: (index: number) => void;
}) {
  if (memories.length === 0) {
    return (
      <p className="px-2 py-8 text-center text-sm text-muted-foreground">
        {t('No memories yet.')}
      </p>
    );
  }

  return (
    <ul className="space-y-0.5">
      {memories.map((memory, index) => (
        <li
          key={index}
          className="group flex items-start gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted"
        >
          <span className="flex-1">{memory}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
            onClick={() => onForget(index)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </li>
      ))}
    </ul>
  );
}
