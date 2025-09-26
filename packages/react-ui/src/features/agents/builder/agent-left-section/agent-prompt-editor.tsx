import BulletList from '@tiptap/extension-bullet-list';
import Document from '@tiptap/extension-document';
import HardBreak from '@tiptap/extension-hard-break';
import Heading from '@tiptap/extension-heading';
import History from '@tiptap/extension-history';
import ListItem from '@tiptap/extension-list-item';
import OrderedList from '@tiptap/extension-ordered-list';
import Paragraph from '@tiptap/extension-paragraph';
import Placeholder from '@tiptap/extension-placeholder';
import Text from '@tiptap/extension-text';
import { Typography } from '@tiptap/extension-typography';
import { useEditor, EditorContent } from '@tiptap/react';
import { t } from 'i18next';
import { Sparkles } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Markdown } from 'tiptap-markdown';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { agentHooks } from '@/features/agents/lib/agent-hooks';
import { useBuilderAgentState } from '@/features/agents/lib/store/builder-agent-state-provider';
import { isNil } from '@activepieces/shared';

type FormValues = {
  systemPrompt: string;
};

const extensions = (placeholder: string) => {
  return [
    Document,
    History,
    HardBreak,
    Paragraph.configure({
      HTMLAttributes: {
        class: 'mb-3 last:mb-0',
      },
    }),
    Text,
    Heading.configure({
      levels: [1, 2, 3, 4, 5, 6],
      HTMLAttributes: {
        class: 'font-bold leading-tight mb-4 mt-6 first:mt-0',
      },
    }),
    BulletList.configure({
      HTMLAttributes: {
        class: 'list-disc ml-6 mb-3 space-y-1',
      },
    }),
    OrderedList.configure({
      HTMLAttributes: {
        class: 'list-decimal ml-6 mb-3 space-y-1',
      },
    }),
    ListItem.configure({
      HTMLAttributes: {
        class: 'leading-relaxed',
      },
    }),
    Typography,
    Placeholder.configure({
      placeholder,
      emptyEditorClass: 'is-editor-empty',
    }),
    Markdown.configure({
      html: false,
      transformCopiedText: true,
      transformPastedText: true,
    }),
  ];
};

export const AgentPromptEditor = () => {
  const [updateAgent, agent] = useBuilderAgentState((state) => [
    state.updateAgent,
    state.agent,
  ]);

  const { mutate: enhancePrompt, isPending } =
    agentHooks.useEnhanceAgentPrompt();

  const { setValue, watch } = useForm<FormValues>({
    defaultValues: {
      systemPrompt: agent?.systemPrompt ?? '',
    },
  });

  useEffect(() => {
    setValue('systemPrompt', agent?.systemPrompt ?? '');
  }, [agent?.systemPrompt, setValue]);

  const systemPromptValue = watch('systemPrompt');

  const handleEnhancePrompt = () => {
    enhancePrompt(
      { systemPrompt: systemPromptValue, agentId: agent.id },
      {
        onSuccess: (data) => {
          updateAgent({ ...data });
          setValue('systemPrompt', data.systemPrompt, { shouldDirty: true });
          editor?.chain().focus().insertContent(data.systemPrompt).run();
        },
      },
    );
  };

  const editor = useEditor({
    editable: !isNil(agent) && !isPending,
    extensions: extensions(
      t(
        "Describe this agent's purpose, responsibilities, and any special instructions.",
      ),
    ),
    content: systemPromptValue,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none p-4 min-h-[200px]',
        style: 'word-wrap: break-word; white-space: pre-wrap;',
      },
    },
    onUpdate: ({ editor }) => {
      const markdownContent = editor.storage.markdown.getMarkdown();
      updateAgent({ systemPrompt: markdownContent }, true);
    },
  });

  return (
    <div className="flex-1 rounded-md min-h-0 w-full relative bg-background">
      {isPending && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-md flex items-center justify-center z-20">
          <div className="flex flex-col items-center gap-3 text-center">
            <Sparkles className="w-6 h-6 animate-pulse text-primary" />
            <div className="text-sm font-medium text-foreground">
              {t('Enhancing prompt...')}
            </div>
            <div className="text-xs text-muted-foreground">
              {t('Please wait while we improve your prompt')}
            </div>
          </div>
        </div>
      )}
      <div className="h-full overflow-auto flex">
        <div className="grow">
          <EditorContent editor={editor} />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="text-primary-300 hover:text-primary  "
              onClick={handleEnhancePrompt}
              disabled={isPending || isNil(agent)}
              tabIndex={-1}
              type="button"
            >
              {isPending ? (
                <Sparkles className="w-4 h-4 animate-pulse" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('Enhance prompt')}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
};
