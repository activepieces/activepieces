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
      <p className="px-2 py-8 text-center text-sm text-gray-11">
        {t('No memories yet.')}
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-0.5">
      {memories.map((memory, index) => (
        <li
          key={index}
          className="group flex items-start gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-gray-3"
        >
          <span className="flex-1">{memory}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="shrink-0 opacity-0 group-hover:opacity-100"
            onClick={() => onForget(index)}
          >
            <X />
          </Button>
        </li>
      ))}
    </ul>
  );
}
