import {
  ApFunction,
  evaluateExpression,
  flowStructureUtil,
  isNil,
  typeCheckTiptapDoc,
} from '@activepieces/shared';
import { Extensions } from '@tiptap/core';
import { Document } from '@tiptap/extension-document';
import { HardBreak } from '@tiptap/extension-hard-break';
import { History } from '@tiptap/extension-history';
import { MentionNodeAttrs, Mention } from '@tiptap/extension-mention';
import { Paragraph } from '@tiptap/extension-paragraph';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Text } from '@tiptap/extension-text';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { inputClass } from '@/components/ui/input';
import { stepsHooks } from '@/features/pieces';
import { cn } from '@/lib/utils';

import { useBuilderStateContext } from '../../builder-hooks';

import { FunctionEditorTooltip } from './components/function-hover-popover';
import { FunctionSearchPopover } from './components/function-search-popover';
import { FunctionEndNode } from './extensions/function-end-node';
import {
  FunctionSlashExtension,
  SlashCommandState,
  insertFunctionAtPos,
  registerSlashCommandHandler,
  unregisterSlashCommandHandler,
} from './extensions/function-slash-extension';
import { FunctionStartNode } from './extensions/function-start-node';
import { textMentionUtils } from './text-input-utils';

type TiptapEditorProps = {
  className?: string;
  initialValue?: unknown;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  enableMarkdown?: boolean;
};

const INITIAL_SLASH_STATE: SlashCommandState = {
  open: false,
  query: '',
  position: { top: 0, left: 0 },
  from: 0,
};

function getExtensions({
  enableMarkdown,
  placeholder,
}: {
  placeholder?: string;
  enableMarkdown?: boolean;
}): Extensions {
  const baseExtensions = [
    Placeholder.configure({
      placeholder: placeholder,
      emptyNodeClass: 'before:text-muted-foreground opacity-75',
    }),
    Mention.configure({
      suggestion: { char: '' },
      deleteTriggerWithBackspace: true,
      renderHTML({ node }) {
        const mentionAttrs = node.attrs as unknown as MentionNodeAttrs;
        return textMentionUtils.generateMentionHtmlElement(mentionAttrs);
      },
    }),
    FunctionStartNode,
    FunctionEndNode,
    FunctionSlashExtension,
  ];

  if (enableMarkdown) {
    return [
      ...baseExtensions,
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
    ] as Extensions;
  }

  return [
    ...baseExtensions,
    Document,
    History,
    HardBreak,
    Text,
    Paragraph.configure({ HTMLAttributes: {} }),
  ] as Extensions;
}

export const TiptapEditor = ({
  className,
  initialValue,
  onChange,
  disabled,
  placeholder,
  enableMarkdown,
}: TiptapEditorProps) => {
  const steps = useBuilderStateContext((state) =>
    flowStructureUtil.getAllSteps(state.flowVersion.trigger),
  );
  const stepsMetadata = stepsHooks
    .useStepsMetadata(steps)
    .map(({ data: metadata }, index) => {
      if (metadata) {
        return { ...metadata, stepDisplayName: steps[index].displayName };
      }
      return undefined;
    });

  const sampleData = useBuilderStateContext((state) => state.outputSampleData);
  const setInsertMentionHandler = useBuilderStateContext(
    (state) => state.setInsertMentionHandler,
  );

  const [slashState, setSlashState] =
    useState<SlashCommandState>(INITIAL_SLASH_STATE);
  const slashStateRef = useRef(slashState);
  slashStateRef.current = slashState;

  const [previewMode, setPreviewMode] = useState(false);
  const [previewValue, setPreviewValue] = useState<string>('');
  const [previewError, setPreviewError] = useState(false);
  const previewModeRef = useRef(previewMode);
  previewModeRef.current = previewMode;

  const editorRef = useRef<ReturnType<typeof useEditor> | null>(null);
  const editorWrapperRef = useRef<HTMLDivElement>(null);

  const closeSlash = useCallback(() => {
    setSlashState(INITIAL_SLASH_STATE);
  }, []);

  const handleFunctionSelect = useCallback((fn: ApFunction) => {
    const editor = editorRef.current;
    if (!editor) return;
    insertFunctionAtPos(
      editor,
      fn,
      slashStateRef.current.from,
      slashStateRef.current.query,
    );
    setSlashState(INITIAL_SLASH_STATE);
  }, []);

  const insertMention = (propertyPath: string) => {
    const mentionNode = textMentionUtils.createMentionNodeFromText(
      `{{${propertyPath}}}`,
      steps,
      stepsMetadata,
    );
    editorRef.current?.chain().focus().insertContent(mentionNode).run();
  };

  const editor = useEditor({
    editable: !disabled,
    extensions: getExtensions({ placeholder, enableMarkdown }),
    content: {
      type: 'doc',
      content: textMentionUtils.convertTextToTipTapJsonContent(
        convertToText(initialValue),
        steps,
        stepsMetadata,
      ),
    },
    editorProps: {
      attributes: {
        class: cn(
          className ?? cn(inputClass, 'py-2 h-[unset] block   min-h-9  '),
          textMentionUtils.inputWithMentionsCssClass,
          { 'cursor-not-allowed opacity-50': disabled },
        ),
      },
    },
    onCreate: ({ editor: e }) => {
      const editorContent = e.getJSON();
      requestAnimationFrame(() => {
        applyTypeErrors(editorContent, editorWrapperRef.current);
      });
    },
    onUpdate: ({ editor: e }) => {
      const editorContent = e.getJSON();
      const textResult =
        textMentionUtils.convertTiptapJsonToText(editorContent);
      if (onChange) onChange(textResult);
      if (previewModeRef.current) updatePreview(textResult);
      requestAnimationFrame(() => {
        applyTypeErrors(editorContent, editorWrapperRef.current);
      });
    },
    onFocus: () => {
      setInsertMentionHandler(insertMention);
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    registerSlashCommandHandler({
      getState: () => slashStateRef.current,
      setState: setSlashState,
    });
    return () => unregisterSlashCommandHandler();
  }, [editor]);

  const updatePreview = useCallback(
    (expression: string) => {
      const flatData = flattenSampleData(sampleData ?? {});
      const { result, error } = evaluateExpression(expression, flatData);
      setPreviewValue(error ?? (result != null ? String(result) : ''));
      setPreviewError(error !== null);
    },
    [sampleData],
  );

  const togglePreview = () => {
    if (!previewMode && editor) {
      const text = textMentionUtils.convertTiptapJsonToText(editor.getJSON());
      updatePreview(text);
    }
    setPreviewMode((prev) => !prev);
  };

  if (!editor) return null;

  return (
    <div className="w-full" ref={editorWrapperRef}>
      <div className="flex justify-end mb-0.5">
        <button
          type="button"
          onClick={togglePreview}
          className="text-[11px] text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
        >
          {previewMode ? 'Edit' : 'Preview'}
        </button>
      </div>

      {previewMode ? (
        <div
          className={cn(
            className ?? cn(inputClass, 'py-2 h-[unset] block min-h-9'),
            'whitespace-pre-wrap break-all text-sm',
            previewError && 'border-red-400',
          )}
        >
          {previewValue ? (
            <span className={previewError ? 'text-red-500' : undefined}>
              {previewError && '⚠ '}
              {previewValue}
            </span>
          ) : (
            <span className="text-muted-foreground opacity-50">
              {placeholder}
            </span>
          )}
        </div>
      ) : (
        <EditorContent editor={editor} />
      )}

      <FunctionEditorTooltip editorRef={editorWrapperRef} />

      {slashState.open && (
        <FunctionSearchPopover
          query={slashState.query}
          position={slashState.position}
          onSelect={handleFunctionSelect}
          onClose={closeSlash}
        />
      )}
    </div>
  );
};

function convertToText(value: unknown): string {
  if (isNil(value)) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  return JSON.stringify(value);
}

function applyTypeErrors(
  doc: import('@tiptap/react').JSONContent,
  wrapperEl: HTMLElement | null,
) {
  if (!wrapperEl) return;
  const errors = typeCheckTiptapDoc(doc);

  wrapperEl
    .querySelectorAll<HTMLElement>('[data-function-start]')
    .forEach((badge) => {
      const id = badge.getAttribute('data-function-start');
      const err = id ? errors.get(id) : undefined;
      if (err) {
        badge.classList.add('ap-fn-error');
        badge.setAttribute('data-fn-error-msg', err);
      } else {
        badge.classList.remove('ap-fn-error');
        badge.removeAttribute('data-fn-error-msg');
      }
    });

  wrapperEl
    .querySelectorAll<HTMLElement>('[data-function-end]')
    .forEach((badge) => {
      const openId = badge.getAttribute('data-function-end');
      const err = openId ? errors.get(openId) : undefined;
      if (err) badge.classList.add('ap-fn-error');
      else badge.classList.remove('ap-fn-error');
    });
}

function flattenSampleData(
  sampleData: Record<string, unknown>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  function walk(obj: unknown, prefix: string) {
    if (obj === null || obj === undefined) {
      result[prefix] = obj;
      return;
    }
    if (typeof obj !== 'object') {
      result[prefix] = obj;
      return;
    }
    if (Array.isArray(obj)) {
      result[prefix] = obj;
      obj.forEach((item, i) => walk(item, `${prefix}.${i}`));
      return;
    }
    result[prefix] = obj;
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      walk(v, prefix ? `${prefix}.${k}` : k);
    }
  }

  for (const [k, v] of Object.entries(sampleData)) {
    walk(v, k);
  }

  return result;
}
