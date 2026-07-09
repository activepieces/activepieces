import {
  flowStructureUtil,
  isNil,
  NoteColorVariant,
} from '@activepieces/shared';
import { Editor } from '@tiptap/core';
import { useReactFlow } from '@xyflow/react';
import { t } from 'i18next';
import { Pin, PinOff, TrashIcon } from 'lucide-react';
import { forwardRef, useRef, useState } from 'react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { ApNodeType } from '@/app/builder/flow-canvas/utils/types';
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
  const [
    updateNoteColor,
    deleteNote,
    getNoteById,
    setNoteAnchor,
    moveNote,
    flowVersion,
  ] = useBuilderStateContext((state) => [
    state.updateNoteColor,
    state.deleteNote,
    state.getNoteById,
    state.setNoteAnchor,
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
  const togglePin = () => {
    if (isNil(note)) {
      return;
    }
    const notePosition = reactFlow.getNode(id)?.position ?? note.position;
    if (anchor) {
      moveNote({ id, position: notePosition, anchor: null });
      return;
    }
    const nearestStepNode = findNearestStepNode({
      stepNodes: reactFlow
        .getNodes()
        .filter((node) => node.type === ApNodeType.STEP),
      origin: notePosition,
    });
    if (isNil(nearestStepNode)) {
      return;
    }
    setNoteAnchor({
      id,
      anchor: {
        stepName: nearestStepNode.id,
        offset: {
          x: notePosition.x - nearestStepNode.position.x,
          y: notePosition.y - nearestStepNode.position.y,
        },
      },
    });
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
          <ToolWrapper
            tooltip={
              anchor
                ? t('Pinned to {stepName}', {
                    stepName: anchoredStepDisplayName,
                  })
                : t('Pin to nearest step')
            }
          >
            <Button variant="ghost" size="icon" onClick={togglePin}>
              {anchor ? (
                <PinOff className="size-4" />
              ) : (
                <Pin className="size-4" />
              )}
            </Button>
          </ToolWrapper>
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

function findNearestStepNode({
  stepNodes,
  origin,
}: {
  stepNodes: { id: string; position: { x: number; y: number } }[];
  origin: { x: number; y: number };
}): { id: string; position: { x: number; y: number } } | null {
  return stepNodes.reduce<{
    id: string;
    position: { x: number; y: number };
  } | null>((nearest, node) => {
    if (isNil(nearest)) {
      return node;
    }
    return squaredDistance({ from: origin, to: node.position }) <
      squaredDistance({ from: origin, to: nearest.position })
      ? node
      : nearest;
  }, null);
}

function squaredDistance({
  from,
  to,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
}): number {
  return (from.x - to.x) ** 2 + (from.y - to.y) ** 2;
}

const NoteColorPickerClassName = {
  [NoteColorVariant.YELLOW]: 'bg-amber-400',
  [NoteColorVariant.ORANGE]: 'bg-orange-400',
  [NoteColorVariant.RED]: 'bg-red-400',
  [NoteColorVariant.GREEN]: 'bg-green-400',
  [NoteColorVariant.BLUE]: 'bg-blue-400',
  [NoteColorVariant.PURPLE]: 'bg-purple-400',
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
            NoteColorPickerClassName[color] ??
              NoteColorPickerClassName[NoteColorVariant.YELLOW],
            'size-4 shrink-0 rounded-full',
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
