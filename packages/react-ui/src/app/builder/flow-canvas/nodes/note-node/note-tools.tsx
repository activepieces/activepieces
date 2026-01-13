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
    <div ref={containerRef} className="absolute -top-[45px] w-full left-0">
      <div className="flex items-center justify-center">
        <div className="p-1 bg-background flex items-center gap-0.5 shadow-md rounded-lg scale-65 border border-solid border-border">
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


const NoteColorPickerClassName = {
  [NoteColorVariant.YELLOW]: 'bg-amber-400',      
  [NoteColorVariant.ORANGE]: 'bg-orange-400',
  [NoteColorVariant.RED]: 'bg-red-400',
  [NoteColorVariant.GREEN]: 'bg-green-400',
  [NoteColorVariant.BLUE]: 'bg-blue-400',
  [NoteColorVariant.PURPLE]: 'bg-purple-400',
}

const NoteColorPicker = ({
  currentColor,
  setCurrentColor,
  container,
}: NoteColorPickerProps) => {
  return (
    <Popover >
      <PopoverTrigger asChild>
        <div
          className={cn(
            NoteColorPickerClassName[currentColor] ??
              NoteColorPickerClassName[NoteColorVariant.YELLOW],
            'mx-0.5 size-5 shrink-0  rounded-full cursor-pointer',
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
                  NoteColorPickerClassName[color] ??
                    NoteColorPickerClassName[NoteColorVariant.YELLOW],
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
};

type NoteColorPickerProps = {
  currentColor: NoteColorVariant;
  setCurrentColor: (color: NoteColorVariant) => void;
  container: HTMLDivElement | null;
};
