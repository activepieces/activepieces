import { useState, useRef, useCallback } from 'react';

import { isNil } from '@activepieces/shared';

import { Tooltip, TooltipContent, TooltipTrigger } from './tooltip';

type EditableTextProps = {
  value: string | undefined;
  className?: string;
  readonly: boolean;
  onValueChange: (value: string) => void;
  tooltipContent?: string;
  disallowEditingOnClick?: boolean;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
};

const EditableText = ({
  value: initialValue,
  className = '',
  readonly = false,
  onValueChange,
  tooltipContent,
  disallowEditingOnClick,
  isEditing,
  setIsEditing,
}: EditableTextProps) => {
  const [value, setValue] = useState(initialValue);
  const isEditingPreviousRef = useRef(false);
  const valueOnEditingStartedRef = useRef(initialValue);

  if (value !== initialValue) {
    setValue(initialValue);
  }
  const editableTextRef = useRef<HTMLDivElement>(null);

  const emitChangedValue = useCallback(() => {
    const nodeValue = (editableTextRef.current?.textContent ?? '').trim();
    const shouldUpdateValue =
      nodeValue.length > 0 && nodeValue !== valueOnEditingStartedRef.current;

    setValue(shouldUpdateValue ? nodeValue : valueOnEditingStartedRef.current);
    if (shouldUpdateValue) {
      onValueChange(nodeValue);
    }
  }, [onValueChange, valueOnEditingStartedRef.current]);

  const setSelectionToValue = () => {
    requestAnimationFrame(() => {
      if (
        editableTextRef.current &&
        window.getSelection &&
        document.createRange
      ) {
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(editableTextRef.current);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    });
  };

  if (isEditing && !isEditingPreviousRef.current) {
    valueOnEditingStartedRef.current = value ? value.trim() : '';

    setSelectionToValue();
  }
  isEditingPreviousRef.current = isEditing;

  return !isEditing ? (
    <Tooltip>
      <TooltipTrigger
        disabled={
          readonly ||
          isEditing ||
          disallowEditingOnClick ||
          isNil(tooltipContent)
        }
        asChild
      >
        <div
          onClick={() => {
            if (!isEditing && !readonly && !disallowEditingOnClick) {
              setIsEditing(true);
            }
          }}
          ref={editableTextRef}
          key={'viewed'}
          className={`${className} truncate `}
          title={
            editableTextRef.current &&
            editableTextRef.current.scrollWidth >
              editableTextRef.current.clientWidth &&
            value
              ? value
              : ''
          }
        >
          {value}
        </div>
      </TooltipTrigger>
      {tooltipContent && (
        <TooltipContent className="font-normal z-50" side="bottom">
          {tooltipContent}
        </TooltipContent>
      )}
    </Tooltip>
  ) : (
    <div
      key={'editable'}
      ref={editableTextRef}
      contentEditable
      suppressContentEditableWarning={true}
      className={`${className}  focus:outline-none break-all`}
      onBlur={() => {
        emitChangedValue();
        setIsEditing(false);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setValue(valueOnEditingStartedRef.current);
          setIsEditing(false);
        } else if (event.key === 'Enter') {
          emitChangedValue();
          setIsEditing(false);
        }
      }}
    >
      {value}
    </div>
  );
};

EditableText.displayName = 'EditableText';
export default EditableText;
