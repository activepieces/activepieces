import { useDraggable } from '@dnd-kit/core';
import { Editor } from '@tiptap/core';
import { NodeProps, NodeResizeControl } from '@xyflow/react';
import { t } from 'i18next';
import { useRef, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

import { MarkdownInput } from '@/components/ui/markdown-input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Note, NoteColorVariant } from '@activepieces/shared';

import { useBuilderStateContext } from '../../../builder-hooks';
import { flowCanvasConsts } from '../../utils/consts';
import { ApNoteNode } from '../../utils/types';

import { NoteFooter } from './note-footer';
import { NoteTools } from './note-tools';

const ApNoteCanvasNode = (props: NodeProps & Omit<ApNoteNode, 'position'>) => {
  const [draggedNote, resizeNote, note, readonly] = useBuilderStateContext(
    (state) => [
      state.draggedNote,
      state.resizeNote,
      state.getNoteById(props.id),
      state.readonly,
    ],
  );
  const { attributes, listeners, setNodeRef } = useDraggable({
    id: props.id,
    data: {
      type: flowCanvasConsts.DRAGGED_NOTE_TAG,
    },
  });
  //because react flow only detects nowheel class, it doesn't work with focus-within:nowheel
  const [isFocusWithin, setIsFocusWithin] = useState(false);
  const [size, setSize] = useState(props.data.size);
  if (draggedNote?.id === props.id || note === null) {
    return null;
  }
  return (
    <div
      className={cn('group note-node outline-none', {
        nowheel: isFocusWithin,
      })}
      onFocus={() => setIsFocusWithin(true)}
      onBlur={() => setIsFocusWithin(false)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          setIsFocusWithin(false);
          if (
            document.activeElement instanceof HTMLElement &&
            document.activeElement.closest('.note-node')
          ) {
            document.activeElement.blur();
          }
        }
      }}
    >
      <NodeResizeControl
        minWidth={150}
        minHeight={150}
        maxWidth={600}
        maxHeight={600}
        onResize={(_, params) => {
          // update the size locally means that we don't re-render the whole graph
          setSize({ width: params.width, height: params.height });
        }}
        onResizeEnd={(_, params) => {
          resizeNote(props.id, {
            width: params.width,
            height: params.height,
          });
        }}
      >
        <button
          className={cn(
            'group-focus-within:block hidden outline-none cursor-nwse-resize  rounded-full bg-stone-50 border border-solid  -translate-x-[60%] -translate-y-[60%] p-0.75',
            FocusedBorderClassName[note.color],
          )}
        ></button>
      </NodeResizeControl>

      <div
        key={
          props.data.size.height +
          props.data.size.width +
          note.position.x +
          note.position.y
        }
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        className={cn(
          'p-0.75 outline-none group-focus-within:border-solid border border-transparent outline-hidden rounded-md',
          {
            'cursor-default': readonly,
          },
          FocusedBorderClassName[note.color],
        )}
      >
        <NoteContent
          note={{
            ...note,
            size,
          }}
          isDragging={false}
        />
      </div>
    </div>
  );
};
ApNoteCanvasNode.displayName = 'ApNoteCanvasNode';

const NoteContent = ({ note, isDragging }: NoteContentProps) => {
  const { id, ownerId: creatorId, color, size } = note;
  const { width, height } = size;
  const [localNote, setLocalNote] = useState(note);
  const [updateContent, readonly] = useBuilderStateContext((state) => [
    state.updateContent,
    state.readonly,
  ]);
  const debouncedUpdateContent = useDebouncedCallback(
    (id: string, content: string) => {
      updateContent(id, content);
    },
    500,
  );

  const editorRef = useRef<Editor | null>(null);
  return (
    <div
      id={id}
      className={cn(
        'rounded-md border-solid shadow-sm p-2 ',
        NoteColorVariantClassName[color],
      )}
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      {!isDragging && !readonly && editorRef.current && (
        <div
          className="opacity-0 focus-within:opacity-100 pointer-events-none group-focus-within:pointer-events-auto group-focus-within:opacity-100 transition-opacity duration-300"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <NoteTools
            editor={editorRef.current}
            currentColor={note.color}
            id={id}
          />
        </div>
      )}

      <div className="flex flex-col gap-2 h-full">
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              onContextMenu={(e) => e.stopPropagation()}
              className="grow h-full overflow-auto "
              onDoubleClick={(e) => {
                e.stopPropagation();
                editorRef.current?.commands.focus();
              }}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Shift') {
                  e.stopPropagation();
                }
              }}
            >
              <MarkdownInput
                ref={editorRef}
                key={`${localNote.id}-${readonly ? 'readonly' : 'editable'}-${
                  localNote.position.x
                }-${localNote.position.y}`}
                disabled={isDragging || readonly}
                initialValue={localNote.content}
                className={cn(
                  'text-xs h-full',
                  NoteColorVariantClassName[color],
                  {
                    '!cursor-grabbing': isDragging,
                    '!text-foreground': true,
                  },
                )}
                onlyEditableOnDoubleClick={true}
                placeholder={t('Double click to edit...')}
                placeholderClassName={cn(
                  'text-xs',
                  NoteColorVariantClassName[color],
                )}
                onChange={(value: string) => {
                  if (value !== localNote.content) {
                    setLocalNote({ ...localNote, content: value });
                    debouncedUpdateContent(id, value);
                  }
                }}
              />
            </div>
          </TooltipTrigger>
          {!readonly && !isDragging && !editorRef.current?.isFocused && (
            <TooltipContent side="right">
              {t('Double click to edit')}
            </TooltipContent>
          )}
        </Tooltip>
        <NoteFooter id={id} isDragging={isDragging} creatorId={creatorId} />
      </div>
    </div>
  );
};
export { ApNoteCanvasNode, NoteContent };
type NoteContentProps = {
  note: Note;
  isDragging: boolean;
};

const NoteColorVariantClassName = {
  [NoteColorVariant.YELLOW]:
    'dark:bg-[oklch(0.3052_0.0455_83.74)] dark:text-[oklch(0.8826_0.1328_86.23)] bg-[oklch(0.9638_0.0522_92.93)] text-[oklch(0.4784_0.1089_63.21)]',
  [NoteColorVariant.ORANGE]:
    'dark:bg-[oklch(0.2968_0.0566_51.71)] dark:text-[oklch(0.8717_0.0836_58.75)] text-[oklch(0.4905_0.140461_44.9084)] bg-[oklch(0.9583_0.0245_61.65)]',
  [NoteColorVariant.RED]:
    'dark:bg-[oklch(0.3046_0.0779_7.16)] dark:text-[oklch(0.9002_0.052_18.16)] bg-[oklch(0.956_0.0218_17.54)] text-[oklch(0.5141_0.1849_26.72)]',
  [NoteColorVariant.GREEN]:
    'dark:bg-[oklch(0.3411_0.0464_168.94)] dark:text-[oklch(0.9025_0.0888_163.86)] text-[oklch(0.5208_0.115675_161.168)] bg-[oklch(0.9667_0.0353_162.37)]',
  [NoteColorVariant.BLUE]:
    'dark:bg-[oklch(0.3086_0.0738_264.7)] dark:text-[oklch(0.8746_0.061_264.64)] bg-[oklch(0.9474_0.0249_263.33)] text-[oklch(0.4975_0.1752_261.14)]',
  [NoteColorVariant.PURPLE]:
    'dark:bg-[oklch(0.2936_0.1027_291.89)] dark:text-[oklch(0.8565_0.0834_300.16)] text-[oklch(0.4647_0.186_293.18)] bg-[oklch(0.9633_0.0206_301.15)]',
};

const FocusedBorderClassName = {
  [NoteColorVariant.YELLOW]:
    'dark:group-focus-within:text-[oklch(0.8826_0.1328_86.23)] group-focus-within:border-[oklch(0.4784_0.1089_63.21)]',
  [NoteColorVariant.ORANGE]:
    'dark:group-focus-within:text-[oklch(0.8717_0.0836_58.75)] group-focus-within:border-[oklch(0.4905_0.140461_44.9084)]',
  [NoteColorVariant.RED]:
    'dark:group-focus-within:text-[oklch(0.9002_0.052_18.16)] group-focus-within:border-[oklch(0.5141_0.1849_26.72)]',
  [NoteColorVariant.GREEN]:
    'dark:group-focus-within:text-[oklch(0.9025_0.0888_163.86)] group-focus-within:border-[oklch(0.5208_0.115675_161.168)]',
  [NoteColorVariant.BLUE]:
    'dark:group-focus-within:text-[oklch(0.8746_0.061_264.64)] group-focus-within:border-[oklch(0.4975_0.1752_261.14)]',
  [NoteColorVariant.PURPLE]:
    'dark:group-focus-within:text-[oklch(0.8565_0.0834_300.16)] group-focus-within:border-[oklch(0.4647_0.186_293.18)]',
};
