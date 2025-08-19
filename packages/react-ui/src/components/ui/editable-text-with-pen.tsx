import { Pencil } from 'lucide-react';

import { cn } from '@/lib/utils';

import EditableText from './editable-text';

type EditableTextWithPenProps = {
  value: string;
  onValueChange: (newValue: string) => void;
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
  readonly?: boolean;
  className?: string;
  textClassName?: string;
};

const EditableTextWithPen = ({
  value,
  onValueChange,
  isEditing,
  setIsEditing,
  readonly = false,
  className,
  textClassName,
}: EditableTextWithPenProps) => {
  return (
    <div
      onClick={() => {
        if (!readonly && !isEditing) {
          setIsEditing(true);
        }
      }}
      className={cn('flex items-center gap-2', className)}
    >
      <EditableText
        className={textClassName}
        value={value}
        readonly={readonly}
        onValueChange={onValueChange}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
      />
      {!readonly && !isEditing && <Pencil className="w-4 h-4" />}
    </div>
  );
};

EditableTextWithPen.displayName = 'EditableTextWithPen';

export default EditableTextWithPen;
