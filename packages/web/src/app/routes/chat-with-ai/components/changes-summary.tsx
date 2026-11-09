import { t } from 'i18next';
import { useId } from 'react';

import { Change } from '@/features/chat/lib/resources/change-summary';

import { ResourceChip } from './resource-chip';

export function ChangesSummary({ changes }: { changes: Change[] }) {
  const headingId = useId();
  if (changes.length === 0) return null;
  const heading = t(
    'Changed {count, plural, one {# thing} other {# things}}:',
    { count: changes.length },
  );
  return (
    <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-gray-11">
      <span id={headingId}>{heading}</span>
      <ul
        aria-labelledby={headingId}
        className="flex min-w-0 flex-wrap gap-1.5"
      >
        {changes.map((change) => (
          <li key={change.key} className="flex min-w-0 max-w-full">
            <ResourceChip change={change} />
          </li>
        ))}
      </ul>
    </div>
  );
}
