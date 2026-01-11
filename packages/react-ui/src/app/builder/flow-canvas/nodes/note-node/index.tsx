import { useDraggable } from '@dnd-kit/core';
import { Editor } from '@tiptap/core';
import { NodeProps, NodeResizeControl } from '@xyflow/react';
import { useRef, useState } from 'react';
import { useDebouncedCallback } from 'use-debounce';

import { Note, NoteColorVariant } from '@/app/builder/state/notes-state';
import { MarkdownInput } from '@/components/ui/markdown-input';
import { cn } from '@/lib/utils';

import { useBuilderStateContext } from '../../../builder-hooks';
import { flowCanvasConsts } from '../../utils/consts';
import { ApNoteNode } from '../../utils/types';

import { NoteFooter } from './note-footer';
import { NoteColorVariantToTailwind, NoteTools } from './note-tools';

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
    disabled: readonly,
  });

  const [size, setSize] = useState(props.data.size);
  if (draggedNote?.id === props.id || note === null) {
    return null;
  }
  return (
    <div className="group note-node">
      <NodeResizeControl
        minWidth={200}
        minHeight={180}
        maxWidth={550}
        maxHeight={600}
        onResize={(_, params) => {
          // update the size locally means that we don't re-render the whole graph
          setSize({ width: params.width, height: params.height });
        }}
        onResizeEnd={(_, params) => {
          resizeNote(props.id, { width: params.width, height: params.height });
        }}
      >
        <button className="group-focus-within:block hidden outline-none cursor-nwse-resize  rounded-full bg-stone-50 border border-solid border-primary -translate-x-[60%] -translate-y-[60%] p-0.75"></button>
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
          'p-0.5 group-focus-within:border-solid group-focus-within:border-primary border border-transparent rounded-md',
          {},
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
  const { id, creator, color, size } = note;
  const { width, height } = size;
  const [localNote, setLocalNote] = useState(note);
  const [updateContent, readonly, updateNoteColor] = useBuilderStateContext(
    (state) => [state.updateContent, state.readonly, state.updateNoteColor],
  );
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
        'rounded-md bg-amber-200 border-solid shadow-md p-2 ',
        NoteColorVariantToTailwind[color],
      )}
      style={{
        width: `${width}px`,
        height: `${height}px`,
      }}
    >
      {!isDragging && !readonly && editorRef.current && (
        <div className="opacity-0 focus-within:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300">
          <NoteTools
            editor={editorRef.current}
            currentColor={note.color}
            setCurrentColor={(color: NoteColorVariant) =>
              updateNoteColor(id, color)
            }
          />
        </div>
      )}
      <div className="flex flex-col gap-2 h-full">
        <div
          onContextMenu={(e) => e.stopPropagation()}
          className="grow h-full overflow-auto"
          onDoubleClick={(e) => {
            e.stopPropagation();
            editorRef.current?.commands.focus();
          }}
        >
          <MarkdownInput
            ref={editorRef}
            disabled={isDragging || readonly}
            initialValue={localNote.content}
            className={cn(
              'cursor-text text-sm',
              NoteColorVariantToTailwind[color],
              { '!cursor-grabbing': isDragging },
            )}
            onChange={(value: string) => {
              setLocalNote({ ...localNote, content: value });
              debouncedUpdateContent(id, value);
            }}
          />
        </div>
        <NoteFooter id={id} isDragging={isDragging} creator={creator} />
      </div>
    </div>
  );
};
export { ApNoteCanvasNode, NoteContent };
type NoteContentProps = {
  note: Note;
  isDragging: boolean;
};
