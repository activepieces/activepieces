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

import {
  ActiveFunctionInfo,
  FunctionEditorTooltip,
} from './components/function-hover-popover';
import { FunctionSearchPopover } from './components/function-search-popover';
import { FunctionEndNode } from './extensions/function-end-node';
import {
  FunctionSlashExtension,
  SlashCommandState,
  insertFunctionAtPos,
  insertFunctionInline,
  registerSlashCommandHandler,
  unregisterSlashCommandHandler,
  registerInlineAutocompleteHandler,
  unregisterInlineAutocompleteHandler,
} from './extensions/function-slash-extension';
import {
  FunctionStartNode,
  FUNCTION_START_NODE_TYPE,
  FUNCTION_END_NODE_TYPE,
} from './extensions/function-start-node';
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

  const [inlineState, setInlineState] =
    useState<SlashCommandState>(INITIAL_SLASH_STATE);
  const inlineStateRef = useRef(inlineState);
  inlineStateRef.current = inlineState;

  const [activeFn, setActiveFn] = useState<ActiveFunctionInfo | null>(null);
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

  const closeInline = useCallback(() => {
    setInlineState(INITIAL_SLASH_STATE);
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

  const handleInlineFunctionSelect = useCallback((fn: ApFunction) => {
    const editor = editorRef.current;
    if (!editor) return;
    insertFunctionInline(
      editor,
      fn,
      inlineStateRef.current.from,
      inlineStateRef.current.query.length,
    );
    setInlineState(INITIAL_SLASH_STATE);
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
      handleKeyDown: (view, event) => {
        if (event.key !== ')') return false;

        const { state } = view;

        // Collect open and closed function node IDs
        const openIds = new Set<string>();
        const closedIds = new Set<string>();
        state.doc.descendants((node) => {
          if (node.type.name === FUNCTION_START_NODE_TYPE) {
            openIds.add(node.attrs.id as string);
          }
          if (node.type.name === FUNCTION_END_NODE_TYPE) {
            closedIds.add(node.attrs.openId as string);
          }
        });

        const unclosed = [...openIds].filter((id) => !closedIds.has(id));
        if (unclosed.length === 0) return false; // no open function, type normally

        // Find the innermost: the last function_start in doc order that is unclosed
        let innermostId: string | null = null;
        state.doc.descendants((node) => {
          if (
            node.type.name === FUNCTION_START_NODE_TYPE &&
            unclosed.includes(node.attrs.id as string)
          ) {
            innermostId = node.attrs.id as string;
          }
        });

        if (!innermostId) return false;

        // Insert FunctionEndNode at cursor
        const { tr } = state;
        const endNode = state.schema.nodes[FUNCTION_END_NODE_TYPE].create({
          openId: innermostId,
        });
        view.dispatch(tr.replaceSelectionWith(endNode));
        return true; // consumed
      },
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
        applyUnclosedErrors(editorWrapperRef.current);
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
        applyUnclosedErrors(editorWrapperRef.current);
      });
    },
    onSelectionUpdate: ({ editor: e }) => {
      const wrapperEl = editorWrapperRef.current;
      wrapperEl
        ?.querySelectorAll('.ap-fn-cursor-active')
        .forEach((n) => n.classList.remove('ap-fn-cursor-active'));
      const info = getActiveFunctionAtCursor(e, wrapperEl);
      if (info && wrapperEl) {
        wrapperEl
          .querySelector(`[data-function-start="${info.openId}"]`)
          ?.classList.add('ap-fn-cursor-active');
        wrapperEl
          .querySelector(`[data-function-end="${info.openId}"]`)
          ?.classList.add('ap-fn-cursor-active');
      }
      setActiveFn(info);
    },
    onBlur: () => {
      setActiveFn(null);
      editorWrapperRef.current
        ?.querySelectorAll('.ap-fn-cursor-active')
        .forEach((n) => n.classList.remove('ap-fn-cursor-active'));
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
    registerInlineAutocompleteHandler({
      getState: () => inlineStateRef.current,
      setState: setInlineState,
    });
    return () => {
      unregisterSlashCommandHandler();
      unregisterInlineAutocompleteHandler();
    };
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

      <FunctionEditorTooltip editorRef={editorWrapperRef} activeFn={activeFn} />

      {slashState.open && (
        <FunctionSearchPopover
          query={slashState.query}
          position={slashState.position}
          onSelect={handleFunctionSelect}
          onClose={closeSlash}
        />
      )}

      {inlineState.open && (
        <FunctionSearchPopover
          query={inlineState.query}
          position={inlineState.position}
          onSelect={handleInlineFunctionSelect}
          onClose={closeInline}
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

function applyUnclosedErrors(wrapperEl: HTMLElement | null) {
  if (!wrapperEl) return;

  const startBadges = wrapperEl.querySelectorAll<HTMLElement>(
    '[data-function-start]',
  );
  const endBadges = wrapperEl.querySelectorAll<HTMLElement>(
    '[data-function-end]',
  );

  const closedOpenIds = new Set<string>();
  endBadges.forEach((badge) => {
    const openId = badge.getAttribute('data-function-end');
    if (openId) closedOpenIds.add(openId);
  });

  startBadges.forEach((badge) => {
    const id = badge.getAttribute('data-function-start');
    if (!id) return;
    if (!closedOpenIds.has(id)) {
      badge.classList.add('ap-fn-unclosed');
    } else {
      badge.classList.remove('ap-fn-unclosed');
    }
  });
}

function getActiveFunctionAtCursor(
  editor: import('@tiptap/react').Editor,
  wrapperEl: HTMLElement | null,
): ActiveFunctionInfo | null {
  if (!wrapperEl) return null;
  const { state } = editor;
  const cursorPos = state.selection.from;

  // Collect all function nodes with their positions
  const startMap = new Map<string, { pos: number; functionName: string }>();
  const endMap = new Map<string, number>();

  state.doc.descendants((node, pos) => {
    if (node.type.name === FUNCTION_START_NODE_TYPE) {
      startMap.set(node.attrs.id as string, {
        pos,
        functionName: node.attrs.functionName as string,
      });
    }
    if (node.type.name === FUNCTION_END_NODE_TYPE) {
      endMap.set(node.attrs.openId as string, pos);
    }
  });

  // Find innermost function_start whose range contains the cursor
  let innermostId: string | null = null;
  let innermostPos = -1;

  for (const [id, { pos }] of startMap) {
    // Cursor must be strictly after the start badge
    if (pos >= cursorPos) continue;
    // Cursor must be before (or at) the end badge, or inside unclosed function
    const endPos = endMap.has(id) ? endMap.get(id)! : Infinity;
    if (cursorPos > endPos) continue;
    if (pos > innermostPos) {
      innermostId = id;
      innermostPos = pos;
    }
  }

  if (!innermostId) return null;

  const { functionName } = startMap.get(innermostId)!;

  // Count commas between our function_start and cursor, skipping nested functions
  let argIndex = 0;
  let depth = 0;

  state.doc.descendants((node, pos) => {
    // Skip the start node itself and everything before it
    if (pos <= innermostPos) return;
    // Skip nodes at or past the cursor
    if (pos >= cursorPos) return;

    if (node.type.name === FUNCTION_START_NODE_TYPE) {
      depth++;
    } else if (node.type.name === FUNCTION_END_NODE_TYPE) {
      if (depth > 0) depth--;
    } else if (node.isText && depth === 0) {
      const text = node.text ?? '';
      // Only consider characters before the cursor
      const limit = cursorPos - pos;
      const relevant = text.slice(0, limit);
      for (const ch of relevant) {
        if (ch === ',') argIndex++;
      }
    }
  });

  const startEl = wrapperEl.querySelector<HTMLElement>(
    `[data-function-start="${innermostId}"]`,
  );
  const anchorRect = startEl?.getBoundingClientRect() ?? null;
  const errorMessage = startEl?.getAttribute('data-fn-error-msg') ?? null;

  return {
    functionName,
    openId: innermostId,
    argIndex,
    errorMessage,
    anchorRect,
  };
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
