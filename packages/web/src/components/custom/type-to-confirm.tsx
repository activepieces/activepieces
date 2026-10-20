import { t } from 'i18next';
import { useState } from 'react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export const TypeToConfirm = ({
  id,
  text,
  value,
  onChange,
}: {
  id: string;
  text: string;
  value: string;
  onChange: (value: string) => void;
}) => {
  const [before, after] = t('Type {text} to confirm', {
    text: TEXT_SLOT,
  }).split(TEXT_SLOT);
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id} className="font-normal text-gray-11">
        {before}
        <span className="font-semibold text-gray-12">{text}</span>
        {after}
      </Label>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
      />
    </div>
  );
};

export function useTypeToConfirm({
  open,
  text,
}: {
  open: boolean;
  text?: string;
}) {
  const [value, setValue] = useState('');
  const [openSeen, setOpenSeen] = useState(open);
  if (open !== openSeen) {
    setOpenSeen(open);
    setValue('');
  }
  return { value, setValue, confirmed: !text || value === text };
}

const TEXT_SLOT = '\u0000';
