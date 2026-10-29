import { WorkerGroupProjectAssignment } from '@activepieces/shared';
import { t } from 'i18next';
import { Pencil } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { groupUtils, useRunLimit } from './hooks';

export function RunLimitButton({
  project,
}: {
  project: WorkerGroupProjectAssignment;
}) {
  const [open, setOpen] = useState(false);
  const custom = project.maxConcurrentJobs !== null;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-between gap-2 font-normal tabular-nums"
        >
          <span className={cn('truncate', !custom && 'text-gray-11')}>
            {project.maxConcurrentJobs !== null
              ? t('{count, number}', {
                  count: project.maxConcurrentJobs,
                })
              : t('Default ({count, number})', {
                  count: project.defaultMaxConcurrentJobs,
                })}
          </span>
          <Pencil className="size-4 shrink-0 text-gray-10" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" collisionPadding={16} className="w-80">
        {open && (
          <RunLimitForm project={project} onDone={() => setOpen(false)} />
        )}
      </PopoverContent>
    </Popover>
  );
}

function RunLimitForm({
  project,
  onDone,
}: {
  project: WorkerGroupProjectAssignment;
  onDone: () => void;
}) {
  const [value, setValue] = useState(
    project.maxConcurrentJobs === null ? '' : String(project.maxConcurrentJobs),
  );
  const { mutate, isPending } = useRunLimit();
  const trimmed = value.trim();
  const parsed = trimmed === '' ? null : Number(trimmed);
  const invalid = parsed !== null && (!Number.isInteger(parsed) || parsed < 1);

  const save = (maxConcurrentJobs: number | null) => {
    if (maxConcurrentJobs === project.maxConcurrentJobs) {
      onDone();
      return;
    }
    mutate({ projectId: project.id, maxConcurrentJobs }, { onSuccess: onDone });
  };

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (!invalid && !isPending) save(parsed);
      }}
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="run-limit" className="text-sm font-medium text-gray-12">
          {t('Concurrency limit')}
        </label>
        <p className="text-sm text-gray-11">
          {t(
            'How many runs of {project} can go at the same time. Extra runs wait their turn.',
            {
              project: groupUtils.quote(project.displayName),
            },
          )}
        </p>
      </div>
      <Input
        id="run-limit"
        inputMode="numeric"
        autoFocus
        value={value}
        aria-invalid={invalid}
        aria-describedby="run-limit-help"
        placeholder={t('Default ({count, number})', {
          count: project.defaultMaxConcurrentJobs,
        })}
        onChange={(e) => setValue(e.target.value.replace(/[^0-9]/g, ''))}
      />
      <p
        id="run-limit-help"
        className={cn(
          'min-h-8 text-xs',
          invalid ? 'text-danger-11' : 'text-gray-11',
        )}
      >
        {invalid
          ? t('Enter a whole number above 0.')
          : t(
              'Leave it empty to use the default, {count, number}. The default comes from your plan and the group’s capacity.',
              {
                count: project.defaultMaxConcurrentJobs,
              },
            )}
      </p>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onDone}>
          {t('Cancel')}
        </Button>
        <Button type="submit" size="sm" disabled={invalid} loading={isPending}>
          {t('Save')}
        </Button>
      </div>
    </form>
  );
}
