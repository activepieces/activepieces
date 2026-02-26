import { Editor } from '@tiptap/react';
import { t } from 'i18next';
import {
  ImageIcon,
  UnderlineIcon,
  ItalicIcon,
  Strikethrough,
  BoldIcon,
  ArrowDown,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '../button';
import { Input } from '../input';
import { Popover, PopoverContent, PopoverTrigger } from '../popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '../tooltip';

export const MarkdownTools = ({ editor }: { editor: Editor }) => {
  const isStrikeActive = editor.isActive('strike');
  const isBoldActive = editor.isActive('bold');
  const isItalicActive = editor.isActive('italic');
  const isUnderlineActive = editor.isActive('underline');
  //because tiptap doesn't instantly set the active state, we need to use a state to track it
  const [activeState, setActiveState] = useState({
    isStrikeActive,
    isBoldActive,
    isItalicActive,
    isUnderlineActive,
  });
  const handleStrike = () => {
    editor.setEditable(true);
    editor.chain().focus().toggleStrike().run();
    editor.commands.focus();
    setActiveState({
      ...activeState,
      isStrikeActive: !isStrikeActive,
    });
  };
  const handleBold = () => {
    editor.setEditable(true);
    editor.chain().focus().toggleBold().run();
    editor.commands.focus();
    setActiveState({
      ...activeState,
      isBoldActive: !isBoldActive,
    });
  };
  const handleItalic = () => {
    editor.setEditable(true);
    editor.chain().focus().toggleItalic().run();
    editor.commands.focus();
    setActiveState({
      ...activeState,
      isItalicActive: !isItalicActive,
    });
  };
  const handleUnderline = () => {
    editor.setEditable(true);
    editor.chain().focus().toggleUnderline().run();
    editor.commands.focus();
    setActiveState({
      ...activeState,
      isUnderlineActive: !isUnderlineActive,
    });
  };
  useEffect(() => {
    setActiveState({
      isStrikeActive,
      isBoldActive,
      isItalicActive,
      isUnderlineActive,
    });
  }, [isStrikeActive, isBoldActive, isItalicActive, isUnderlineActive]);
  const containerRef = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={containerRef}
      className="flex items-center gap-0.5 text-foreground"
    >
      <ImageTool editor={editor} containerRef={containerRef} />
      <ToolWrapper tooltip={t('Strike')}>
        <Button
          onClick={handleStrike}
          size={'icon'}
          variant={isStrikeActive ? 'default' : 'ghost'}
        >
          <Strikethrough className="size-4" />
        </Button>
      </ToolWrapper>
      <ToolWrapper tooltip={t('Bold')}>
        <Button
          onClick={handleBold}
          size={'icon'}
          variant={isBoldActive ? 'default' : 'ghost'}
        >
          <BoldIcon className="size-4" />
        </Button>
      </ToolWrapper>
      <ToolWrapper tooltip={t('Italic')}>
        <Button
          onClick={handleItalic}
          size={'icon'}
          variant={isItalicActive ? 'default' : 'ghost'}
        >
          <ItalicIcon className="size-4" />
        </Button>
      </ToolWrapper>
      <ToolWrapper tooltip={t('Underline')}>
        <Button
          onClick={handleUnderline}
          size={'icon'}
          variant={isUnderlineActive ? 'default' : 'ghost'}
        >
          <UnderlineIcon className="size-4" />
        </Button>
      </ToolWrapper>
    </div>
  );
};

const ImageTool = ({
  editor,
  containerRef,
}: {
  editor: Editor;
  containerRef: React.RefObject<HTMLDivElement>;
}) => {
  const [open, setOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const handleAddImage = () => {
    editor
      .chain()
      .focus()
      .setImage({ src: imageUrl, alt: 'note-img-' + Date.now() })
      .run();
    editor.commands.focus();
    setImageUrl('');
    setOpen(false);
  };
  return (
    <Popover modal={false} open={open} onOpenChange={setOpen}>
      <ToolWrapper tooltip={t('Image')}>
        <PopoverTrigger asChild>
          <Button size={'icon'} variant={'ghost'}>
            <ImageIcon className="size-4" />
          </Button>
        </PopoverTrigger>
      </ToolWrapper>
      <PopoverContent
        side="top"
        className="p-1 px-1.5 mb-1"
        container={containerRef.current}
      >
        <div className="flex items-center gap-2 min-w-[200px]">
          <Input
            className="h-8"
            onPointerDown={(ev) => ev.stopPropagation()}
            onKeyDown={(ev) => ev.key === 'Enter' && handleAddImage()}
            type="text"
            placeholder="Enter image URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          <Button
            size={'icon'}
            onClick={handleAddImage}
            disabled={imageUrl.length === 0}
            variant={'ghost'}
          >
            <ArrowDown className="size-4" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export const ToolWrapper = ({
  children,
  tooltip,
}: {
  children: React.ReactNode;
  tooltip: string;
}) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
};
