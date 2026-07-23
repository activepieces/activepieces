import {
  flowStructureUtil,
  isNil,
  NoteColorVariant,
} from '@activepieces/shared';
import { Editor } from '@tiptap/core';
import { useReactFlow } from '@xyflow/react';
import { t } from 'i18next';
import { TrashIcon, Unlink } from 'lucide-react';
import { forwardRef, useRef, useState } from 'react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { flowCanvasConsts } from '@/app/builder/flow-canvas/utils/consts';
import {
  MarkdownTools,
  ToolWrapper,
} from '@/components/custom/markdown-input/tools';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export const NoteTools = ({ editor, currentColor, id }: NoteToolsProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [updateNoteColor, deleteNote, getNoteById, moveNote, flowVersion] =
    useBuilderStateContext((state) => [
      state.updateNoteColor,
      state.deleteNote,
      state.getNoteById,
      state.moveNote,
      state.flowVersion,
    ]);
  const reactFlow = useReactFlow();
  const note = getNoteById(id);
  const anchor = note?.anchor ?? null;
  const anchoredStepDisplayName = anchor
    ? flowStructureUtil.getStep(anchor.stepName, flowVersion.trigger)
        ?.displayName ?? anchor.stepName
    : null;
  const unlink = () => {
    if (isNil(note)) {
      return;
    }
    const notePosition = reactFlow.getNode(id)?.position ?? note.position;
    moveNote({ id, position: notePosition, anchor: null });
  };
  return (
    <div
      ref={containerRef}
      className="absolute cursor-default -top-[45px] w-full left-0"
    >
      <div className="flex items-center justify-center">
        <div className="p-1 bg-background flex items-center gap-0.5 shadow-md rounded-lg scale-65 border border-solid border-border">
          <NoteColorPicker
            currentColor={currentColor}
            setCurrentColor={(color: NoteColorVariant) => {
              updateNoteColor(id, color);
            }}
            container={containerRef.current}
          />
          <MarkdownTools editor={editor} />
          <Separator orientation="vertical" className="h-[30px]"></Separator>
          {anchor && (
            <ToolWrapper
              tooltip={t('Unlink from {stepName}', {
                stepName: anchoredStepDisplayName,
              })}
            >
              <Button variant="ghost" size="icon" onClick={unlink}>
                <Unlink className="size-4" />
              </Button>
            </ToolWrapper>
          )}
          <ToolWrapper tooltip={t('Delete')}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                deleteNote(id);
              }}
            >
              <TrashIcon className="size-4 text-destructive" />
            </Button>
          </ToolWrapper>
        </div>
      </div>
    </div>
  );
};

const NoteColorPicker = ({
  currentColor,
  setCurrentColor,
  container,
}: NoteColorPickerProps) => {
  const [open, setOpen] = useState(false);
  const popoverTriggerRef = useRef<HTMLButtonElement>(null);
  return (
    <Popover onOpenChange={setOpen} open={open}>
      <ToolWrapper tooltip={t('Color')}>
        <PopoverTrigger asChild>
          <div>
            <ColorButton
              color={currentColor}
              big={true}
              ref={popoverTriggerRef}
            />
          </div>
        </PopoverTrigger>
      </ToolWrapper>

      <PopoverContent
        container={container}
        side="top"
        className="w-[80px] p-1 mb-2"
      >
        <div className="flex items-center cursor-default gap-1 justify-between flex-wrap w-full ">
          {Object.values(NoteColorVariant).map((color) => (
            <ColorButton
              key={color}
              color={color}
              onClick={() => {
                setCurrentColor(color);
                setOpen(false);
                requestAnimationFrame(() => {
                  popoverTriggerRef.current?.focus();
                });
              }}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
NoteTools.displayName = 'NoteTools';

type NoteToolsProps = {
  editor: Editor;
  currentColor: NoteColorVariant;
  id: string;
};

type NoteColorPickerProps = {
  currentColor: NoteColorVariant;
  setCurrentColor: (color: NoteColorVariant) => void;
  container: HTMLDivElement | null;
};

const ColorButton = forwardRef<HTMLButtonElement, ColorButtonProps>(
  ({ color, onClick, big }, ref) => {
    return (
      <Button
        key={color}
        ref={ref}
        variant="ghost"
        size="icon"
        role="button"
        className={cn('size-5 shrink-0 grow flex items-center justify-center', {
          'size-6': big,
        })}
        onClick={onClick}
        onFocus={() => {
          console.log('focus');
        }}
      >
        <div
          className={cn(
            flowCanvasConsts.NOTE_COLOR_CLASS_NAME[color],
            'size-4 shrink-0 rounded-full bg-current',
            {
              'size-5': big,
            },
          )}
        ></div>
      </Button>
    );
  },
);
ColorButton.displayName = 'ColorButton';
type ColorButtonProps = {
  color: NoteColorVariant;
  onClick?: () => void;
  big?: boolean;
};
