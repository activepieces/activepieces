import { EmojiPicker } from 'frimousse';
import { LoaderIcon } from 'lucide-react';
import type * as React from 'react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';

import { Popover, PopoverContent, PopoverTrigger } from './popover';

export const DEFAULT_IMOJI = '📁';

interface EmojiSelectorProps {
  onEmojiSelect: (emoji: { emoji: string }) => void;
  selectedEmoji: string | null;
}

export const EmojiSelector = ({
  onEmojiSelect,
  selectedEmoji,
}: EmojiSelectorProps) => {
  const handleContentWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
  };

  const [open, setOpen] = useState(false);

  const handleEmojiSelect = (emoji: { emoji: string }) => {
    onEmojiSelect(emoji);
    setOpen(false); // Close the popover when an emoji is selected
  };

  return (
    <Popover modal={false} open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="size-9 text-lg">
          {selectedEmoji || DEFAULT_IMOJI}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-72 border bg-popover rounded-md shadow-md p-0"
        align="center"
        onWheel={handleContentWheel}
        sideOffset={5}
      >
        <EmojiPicker.Root
          className="isolate flex h-[368px] w-fit flex-col bg-white dark:bg-neutral-900"
          onEmojiSelect={handleEmojiSelect}
        >
          <EmojiPicker.Search
            className="z-10 mx-2 mt-2 appearance-none rounded-md bg-neutral-100 px-2.5 py-2 text-sm dark:bg-neutral-800"
            placeholder="Search emoji..."
          />
          <EmojiPicker.Viewport className="relative flex-1 outline-hidden">
            <EmojiPicker.Loading className="absolute inset-0 flex items-center justify-center text-neutral-400 text-sm dark:text-neutral-500">
              <LoaderIcon className="size-4 animate-spin" />
            </EmojiPicker.Loading>
            <EmojiPicker.Empty className="absolute inset-0 flex items-center justify-center text-neutral-400 text-sm dark:text-neutral-500">
              No emoji found.
            </EmojiPicker.Empty>
            <EmojiPicker.List
              className="select-none pb-1.5"
              components={{
                CategoryHeader: ({ category, ...props }) => (
                  <div
                    className="bg-white px-3 pt-3 pb-1.5 font-medium text-neutral-600 text-xs dark:bg-neutral-900 dark:text-neutral-400"
                    {...props}
                  >
                    {category.label}
                  </div>
                ),
                Row: ({ children, ...props }) => (
                  <div className="scroll-my-1.5 px-1.5" {...props}>
                    {children}
                  </div>
                ),
                Emoji: ({ emoji, ...props }) => (
                  <button
                    className="flex size-8 items-center justify-center rounded-md text-lg data-[active]:bg-neutral-100 dark:data-[active]:bg-neutral-800"
                    {...props}
                  >
                    {emoji.emoji}
                  </button>
                ),
              }}
            />
          </EmojiPicker.Viewport>
        </EmojiPicker.Root>
      </PopoverContent>
    </Popover>
  );
};
