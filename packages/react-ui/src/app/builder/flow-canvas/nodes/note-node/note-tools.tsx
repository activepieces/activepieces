import { Editor } from '@tiptap/core';
import { useRef } from 'react';

import { NoteColorVariant } from '@/app/builder/state/notes-state';
import { MarkdownTools } from '@/components/ui/markdown-input/tools';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export const NoteTools = ({
  editor,
  currentColor,
  setCurrentColor,
}: {
  editor: Editor;
  currentColor: NoteColorVariant;
  setCurrentColor: (color: NoteColorVariant) => void;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  return (
    <div ref={containerRef} className="absolute -top-[50px] w-full left-0">
      <div className="flex items-center justify-center">
        <div className="p-1 bg-background flex items-center gap-1 shadow-md rounded-md scale-75 border border-solid border-border">
          <NoteColorPicker
            currentColor={currentColor}
            setCurrentColor={setCurrentColor}
            container={containerRef.current}
          />
          <MarkdownTools editor={editor} />
        </div>
      </div>
    </div>
  );
};

export const NoteColorVariantToTailwind = {
  [NoteColorVariant.ORANGE]: 'bg-orange-200 text-orange-700',
  [NoteColorVariant.RED]: 'bg-red-200 text-red-700',
  [NoteColorVariant.GREEN]: 'bg-emerald-200 text-emrald-700',
  [NoteColorVariant.BLUE]: 'bg-sky-200 text-sky-700',
  [NoteColorVariant.PURPLE]: 'bg-indigo-200 text-indigo-700',
  [NoteColorVariant.YELLOW]: 'bg-amber-200 text-amber-700',
};

const NoteColorPicker = ({
  currentColor,
  setCurrentColor,
  container,
}: {
  currentColor: NoteColorVariant;
  setCurrentColor: (color: NoteColorVariant) => void;
  container: HTMLDivElement | null;
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          className={cn(
            NoteColorVariantToTailwind[currentColor],
            'mx-2 size-5 shrink-0  rounded-full cursor-pointer',
          )}
          role="button"
        ></div>
      </PopoverTrigger>
      <PopoverContent
        container={container}
        side="top"
        className="w-[80px] p-1 mb-2"
      >
        <div className="flex items-center gap-1.5 justify-between flex-wrap w-full ">
          {Object.values(NoteColorVariant).map((color) => (
            <div
              key={color}
              className={cn(
                NoteColorVariantToTailwind[color],
                'size-4 shrink-0 rounded-full cursor-pointer',
              )}
              onClick={() => {
                setCurrentColor(color);
              }}
              role="button"
            ></div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};
NoteTools.displayName = 'NoteTools';
