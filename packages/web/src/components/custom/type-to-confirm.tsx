import { t } from 'i18next';

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

const TEXT_SLOT = '\u0000';
