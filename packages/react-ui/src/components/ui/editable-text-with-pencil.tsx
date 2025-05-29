import { Pencil } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/lib/utils';

import EditableText from './editable-text';

type EditableTextWithPencilProps = {
  value: string | undefined;
  className?: string;
  readonly: boolean;
  onValueChange: (value: string) => void;
  tooltipContent?: string;
  textClassName?: string;
};

const EditableTextWithPencil = ({
  value,
  className = '',
  readonly = false,
  onValueChange,
  tooltipContent,
  textClassName = '',
}: EditableTextWithPencilProps) => {
  const [isEditing, setIsEditing] = useState(false);

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
        tooltipContent={tooltipContent}
        disallowEditingOnClick={false}
        isEditing={isEditing}
        setIsEditing={setIsEditing}
      />
      {!readonly && !isEditing && <Pencil className="w-4 h-4" />}
    </div>
  );
};

EditableTextWithPencil.displayName = 'EditableTextWithPencil';

export { EditableTextWithPencil };
