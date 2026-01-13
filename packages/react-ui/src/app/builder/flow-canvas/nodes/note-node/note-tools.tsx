import { Editor } from '@tiptap/core';
import { useRef } from 'react';

import { MarkdownTools } from '@/components/ui/markdown-input/tools';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { NoteColorVariant } from '@activepieces/shared';

export const NoteTools = ({
  editor,
  currentColor,
  setCurrentColor,
}: NoteToolsProps) => {
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
  [NoteColorVariant.ORANGE]: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
  [NoteColorVariant.RED]: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  [NoteColorVariant.GREEN]: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  [NoteColorVariant.BLUE]: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300',
  [NoteColorVariant.PURPLE]: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300',
  [NoteColorVariant.YELLOW]: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
};

const NoteColorPicker = ({
  currentColor,
  setCurrentColor,
  container,
}: NoteColorPickerProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          className={cn(
            NoteColorVariantToTailwind[currentColor] ??
              NoteColorVariantToTailwind[NoteColorVariant.YELLOW],
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
        <div className="flex items-center cursor-default gap-1 justify-between flex-wrap w-full ">
          {Object.values(NoteColorVariant).map((color) => (
            <div
              key={color}
              role="button"
              className="size-5 shrink-0 cursor-pointer grow flex items-center justify-center"
              onClick={() => {
                setCurrentColor(color);
              }}
            >
              <div
                className={cn(
                  NoteColorVariantToTailwind[color] ??
                    NoteColorVariantToTailwind[NoteColorVariant.YELLOW],
                  'size-4 shrink-0 rounded-full',
                )}
              ></div>
            </div>
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
  setCurrentColor: (color: NoteColorVariant) => void;
}

type NoteColorPickerProps = {
  currentColor: NoteColorVariant;
  setCurrentColor: (color: NoteColorVariant) => void;
  container: HTMLDivElement | null;
}