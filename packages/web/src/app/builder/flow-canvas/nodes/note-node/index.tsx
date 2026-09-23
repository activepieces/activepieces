import { Note, NoteColorVariant } from '@activepieces/shared';
import { useDraggable } from '@dnd-kit/core';
import { Editor } from '@tiptap/core';
import { NodeProps, NodeResizeControl } from '@xyflow/react';
import { t } from 'i18next';
import { useRef, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

import { MarkdownInput } from '@/components/custom/markdown-input';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

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
            'group-focus-within:block hidden outline-none cursor-nwse-resize  rounded-full bg-surface-raised border border-solid  -translate-x-[60%] -translate-y-[60%] p-0.75',
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
  [NoteColorVariant.YELLOW]: 'bg-swatch-6-surface text-swatch-6-ink',
  [NoteColorVariant.ORANGE]: 'bg-swatch-5-surface text-swatch-5-ink',
  [NoteColorVariant.RED]: 'bg-swatch-4-surface text-swatch-4-ink',
  [NoteColorVariant.GREEN]: 'bg-swatch-8-surface text-swatch-8-ink',
  [NoteColorVariant.BLUE]: 'bg-swatch-11-surface text-swatch-11-ink',
  [NoteColorVariant.PURPLE]: 'bg-swatch-1-surface text-swatch-1-ink',
};

const FocusedBorderClassName = {
  [NoteColorVariant.YELLOW]: 'group-focus-within:border-swatch-6-mark',
  [NoteColorVariant.ORANGE]: 'group-focus-within:border-swatch-5-mark',
  [NoteColorVariant.RED]: 'group-focus-within:border-swatch-4-mark',
  [NoteColorVariant.GREEN]: 'group-focus-within:border-swatch-8-mark',
  [NoteColorVariant.BLUE]: 'group-focus-within:border-swatch-11-mark',
  [NoteColorVariant.PURPLE]: 'group-focus-within:border-swatch-1-mark',
};
