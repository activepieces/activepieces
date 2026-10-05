import { t } from 'i18next';
import { useState } from 'react';
import { toast } from 'sonner';

import { SearchInput } from '@/components/custom/search-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import {
  PieceSet,
  PROJECTS,
  pieceSetsUtils,
  usePieceSetsStore,
} from './piece-sets-store';
import { ProjectAvatar } from './piece-sets-ui';

export function AssignProjectsDialog({
  set,
  open,
  onOpenChange,
}: AssignProjectsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open && (
          <AssignProjectsForm
            key={set.id}
            set={set}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function AssignProjectsForm({
  set,
  onDone,
}: {
  set: PieceSet;
  onDone: () => void;
}) {
  const { sets, assignProjects } = usePieceSetsStore();
  const [selected, setSelected] = useState<Set<string>>(
    new Set(set.projectIds),
  );
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const visible = PROJECTS.filter(
    (p) => q === '' || p.name.toLowerCase().includes(q),
  );
  const joining = [...selected].filter((id) => !set.projectIds.includes(id));
  const leaving = set.projectIds.filter((id) => !selected.has(id));
  const defaultSet = sets.find((s) => s.isDefault);

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {t('Projects following {name}', { name: set.name })}
        </DialogTitle>
        <DialogDescription>
          {t('A project follows one policy, so checking it moves it here.')}
        </DialogDescription>
      </DialogHeader>
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder={t('Search projects')}
      />
      <div className="flex max-h-80 flex-col overflow-y-auto rounded-lg border border-gray-6">
        {visible.map((p) => {
          const current = pieceSetsUtils.setOfProject(sets, p.id);
          const checked = selected.has(p.id);
          return (
            <label
              key={p.id}
              className="flex cursor-pointer items-center justify-between gap-3 border-b border-gray-6 px-3 py-2 last:border-b-0 hover:bg-gray-3"
            >
              <span className="flex items-center gap-2.5 text-sm">
                <Checkbox
                  checked={checked}
                  disabled={set.isDefault && current.id === set.id}
                  onCheckedChange={() =>
                    setSelected((prev) => {
                      const next = new Set(prev);
                      if (next.has(p.id)) next.delete(p.id);
                      else next.add(p.id);
                      return next;
                    })
                  }
                />
                <ProjectAvatar project={p} />
                {p.name}
              </span>
              <span className="text-xs text-gray-11">
                {current.id === set.id
                  ? t('On this policy')
                  : t('On {name}', { name: current.name })}
              </span>
            </label>
          );
        })}
        {visible.length === 0 && (
          <p className="px-3 py-4 text-sm text-gray-11">
            {t('No project matches.')}
          </p>
        )}
      </div>
      {(joining.length > 0 || leaving.length > 0) && (
        <p className="text-sm text-gray-11">
          {[
            joining.length > 0 &&
              t('projectsJoining', { count: joining.length, name: set.name }),
            leaving.length > 0 &&
              t('projectsLeaving', {
                count: leaving.length,
                name: defaultSet?.name ?? 'Default',
              }),
          ]
            .filter(Boolean)
            .join(' ')}
        </p>
      )}
      <DialogFooter>
        <Button variant="outline" onClick={onDone}>
          {t('Cancel')}
        </Button>
        <Button
          disabled={joining.length === 0 && leaving.length === 0}
          onClick={() => {
            assignProjects({ setId: set.id, projectIds: [...selected] });
            toast(t('Saved'));
            onDone();
          }}
        >
          {t('Save')}
        </Button>
      </DialogFooter>
    </>
  );
}

type AssignProjectsDialogProps = {
  set: PieceSet;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};
