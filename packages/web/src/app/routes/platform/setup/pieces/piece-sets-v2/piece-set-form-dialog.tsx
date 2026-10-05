import { t } from 'i18next';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { PieceSet, usePieceSetsStore } from './piece-sets-store';

export function PieceSetFormDialog({
  open,
  onOpenChange,
  mode,
  set,
}: PieceSetFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <PieceSetForm
          key={open ? `open-${set?.id ?? 'new'}` : 'closed'}
          mode={mode}
          set={set}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function PieceSetForm({
  mode,
  set,
  onDone,
}: {
  mode: 'create' | 'edit';
  set?: PieceSet;
  onDone: () => void;
}) {
  const navigate = useNavigate();
  const { sets, create, rename } = usePieceSetsStore();
  const [name, setName] = useState(set?.name ?? '');
  const [key, setKey] = useState(set?.key ?? '');
  const [startFrom, setStartFrom] = useState('empty');
  const keyTaken = sets.some(
    (s) => s.id !== set?.id && key.trim() !== '' && s.key === key.trim(),
  );
  const valid = name.trim() !== '' && !keyTaken;

  const submit = () => {
    if (!valid) return;
    if (mode === 'edit' && set) {
      rename({ setId: set.id, name: name.trim(), key: key.trim() || set.key });
      toast(t('Saved'));
      onDone();
      return;
    }
    const id = create({
      name: name.trim(),
      key: key.trim(),
      copyFrom: startFrom,
    });
    toast(t('Created {name}', { name: name.trim() }));
    onDone();
    navigate(`/platform/pieces/piece-sets/${id}`);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {mode === 'create' ? t('New policy') : t('Rename policy')}
        </DialogTitle>
      </DialogHeader>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ps-name">{t('Name')}</Label>
          <Input
            id="ps-name"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder={t('For example: Finance, or Pro plan')}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="ps-key">{t('Embed key')}</Label>
          <Input
            id="ps-key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder={t('Optional')}
            className="font-mono"
          />
          <p className="text-xs text-gray-11">
            {keyTaken
              ? t('Another policy already uses this key.')
              : t('Used by the embed SDK.')}
          </p>
        </div>
        {mode === 'create' && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ps-start">{t('Start from')}</Label>
            <Select value={startFrom} onValueChange={setStartFrom}>
              <SelectTrigger id="ps-start">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="empty">
                  {t('No pieces, I’ll pick them')}
                </SelectItem>
                <SelectItem value="all">
                  {t('Every piece, including new ones')}
                </SelectItem>
                {sets.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {t('A copy of {name}', { name: s.name })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onDone}>
          {t('Cancel')}
        </Button>
        <Button disabled={!valid} onClick={submit}>
          {mode === 'create' ? t('Create policy') : t('Save')}
        </Button>
      </DialogFooter>
    </>
  );
}

type PieceSetFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  set?: PieceSet;
};
