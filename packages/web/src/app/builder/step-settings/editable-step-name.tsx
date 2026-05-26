import { isNil } from '@activepieces/shared';
import { t } from 'i18next';
import { Pencil } from 'lucide-react';
import React, { useCallback, useRef } from 'react';

import EditableText from '@/components/custom/editable-text';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface EditableStepNameProps {
  selectedBranchIndex: number | null;
  displayName: string;
  branchName: string | undefined;
  setDisplayName: (value: string) => void;
  setBranchName: (value: string) => void;
  readonly: boolean;
  isEditingStepOrBranchName: boolean;
  setIsEditingStepOrBranchName: (isEditing: boolean) => void;
  setSelectedBranchIndex: (index: number | null) => void;
  tooltipTitle?: string;
  tooltipDescription?: string;
  pieceVersion?: string;
  stepIndex?: number;
}

const EditableStepName: React.FC<EditableStepNameProps> = ({
  selectedBranchIndex,
  displayName,
  branchName,
  setDisplayName,
  setBranchName,
  readonly,
  isEditingStepOrBranchName,
  setIsEditingStepOrBranchName,
  setSelectedBranchIndex,
  tooltipTitle,
  tooltipDescription,
  pieceVersion,
  stepIndex,
}) => {
  const inBranchView = !isNil(selectedBranchIndex);
  const showActionTooltip =
    !inBranchView &&
    !isEditingStepOrBranchName &&
    (!!tooltipTitle || !!tooltipDescription || !!pieceVersion);
  const handleStartEditing = () => {
    if (!readonly) {
      setIsEditingStepOrBranchName(true);
    }
  };

  return (
    <>
      {inBranchView ? (
        <>
          <div
            className="truncate cursor-pointer hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedBranchIndex(null);
            }}
          >
            {displayName}
          </div>
          /
          <EditableText
            key={branchName}
            onValueChange={(value) => {
              if (value) {
                setBranchName(value);
              }
            }}
            readonly={readonly}
            value={branchName}
            tooltipContent={readonly ? '' : t('Edit Branch Name')}
            isEditing={isEditingStepOrBranchName}
            setIsEditing={setIsEditingStepOrBranchName}
          />
        </>
      ) : isEditingStepOrBranchName ? (
        <StepNameEditor
          value={displayName}
          onValueChange={setDisplayName}
          onCommit={() => setIsEditingStepOrBranchName(false)}
        />
      ) : (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                role={readonly ? undefined : 'button'}
                tabIndex={readonly ? undefined : 0}
                onClick={readonly ? undefined : handleStartEditing}
                onKeyDown={
                  readonly
                    ? undefined
                    : (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleStartEditing();
                        }
                      }
                }
                aria-label={readonly ? undefined : t('Edit Step Name')}
                className={cn(
                  'flex items-center gap-1.5 min-w-0',
                  !readonly &&
                    'cursor-text rounded-sm hover:text-foreground/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                )}
              >
                <span className="truncate text-foreground">
                  {typeof stepIndex === 'number' && `${stepIndex}. `}
                  {displayName}
                </span>
                {!readonly && (
                  <Pencil className="size-3.5 shrink-0 text-muted-foreground" />
                )}
              </div>
            </TooltipTrigger>
            {showActionTooltip && (
              <TooltipContent side="bottom" className="max-w-xs">
                <div className="flex flex-col gap-1">
                  {tooltipTitle && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {tooltipTitle}
                      </span>
                      {pieceVersion && (
                        <span className="text-[11px] font-mono text-background/90">
                          (v{pieceVersion})
                        </span>
                      )}
                    </div>
                  )}
                  {!tooltipTitle && pieceVersion && (
                    <span className="text-[11px] font-mono text-background/90">
                      (v{pieceVersion})
                    </span>
                  )}
                  {tooltipDescription && (
                    <div className="text-xs text-background/90">
                      {tooltipDescription}
                    </div>
                  )}
                </div>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      )}
      {inBranchView && !isEditingStepOrBranchName && !readonly && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
                onClick={handleStartEditing}
                aria-label={t('Edit Branch Name')}
              >
                <Pencil className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {t('Edit Branch Name')}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </>
  );
};

type StepNameEditorProps = {
  value: string;
  onValueChange: (value: string) => void;
  onCommit: () => void;
};

const StepNameEditor = ({
  value,
  onValueChange,
  onCommit,
}: StepNameEditorProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const focusAndSelect = useCallback((el: HTMLDivElement | null) => {
    ref.current = el;
    if (!el) return;
    requestAnimationFrame(() => {
      el.focus();
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(el);
      sel?.removeAllRanges();
      sel?.addRange(range);
    });
  }, []);

  const commit = () => {
    const next = (ref.current?.textContent ?? '').trim();
    if (next.length > 0 && next !== value) {
      onValueChange(next);
    }
    onCommit();
  };

  return (
    <div
      ref={focusAndSelect}
      contentEditable
      suppressContentEditableWarning
      className="truncate focus:outline-hidden break-all"
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          if (ref.current) {
            ref.current.textContent = value;
          }
          onCommit();
        } else if (event.key === 'Enter') {
          event.preventDefault();
          commit();
        }
      }}
    >
      {value}
    </div>
  );
};

export default EditableStepName;
