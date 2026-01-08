import { Editor } from '@tiptap/core';

import { MarkdownTools } from '@/components/ui/markdown-input/tools';

export const NoteTools = ({ editor }: { editor: Editor }) => {
  return (
    <div className="absolute -top-[50px] w-full left-0">
      <div className="flex items-center justify-center">
        <div className="p-1 bg-background flex items-center gap-1 shadow-md rounded-md scale-75 border border-solid border-border">
          <MarkdownTools editor={editor} />
        </div>
      </div>
    </div>
  );
};

NoteTools.displayName = 'NoteTools';
