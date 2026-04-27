import {
  ApFunction,
  flowStructureUtil,
  formulaEvaluator,
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
import { Fragment } from '@tiptap/pm/model';
import { TextSelection } from '@tiptap/pm/state';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { t } from 'i18next';
import { ChevronRight, XCircle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
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
  FunctionArgSeparatorNode,
  FUNCTION_SEP_NODE_TYPE,
} from './extensions/function-sep-node';
import {
  FunctionSlashExtension,
  SlashCommandState,
  insertFunctionAtPos,
  setSlashCommandHandler,
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
    FunctionArgSeparatorNode,
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

  const [activeFn, setActiveFn] = useState<ActiveFunctionInfo | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [hasFunctions, setHasFunctions] = useState(false);
  const [previewResult, setPreviewResult] = useState<string>('');
  const [previewErrorMsg, setPreviewErrorMsg] = useState<string | null>(null);
  const [typeErrors, setTypeErrors] = useState<string[]>([]);
  const isFocusedRef = useRef(isFocused);
  isFocusedRef.current = isFocused;
  const hasFunctionsRef = useRef(hasFunctions);
  hasFunctionsRef.current = hasFunctions;

  const editorRef = useRef<ReturnType<typeof useEditor> | null>(null);
  const editorWrapperRef = useRef<HTMLDivElement>(null);

  const closeSlash = useCallback(() => {
    setSlashState(INITIAL_SLASH_STATE);
  }, []);

  const handleFunctionSelect = useCallback((fn: ApFunction) => {
    const editor = editorRef.current;
    if (!editor) return;
    insertFunctionAtPos({
      editor,
      fn,
      from: slashStateRef.current.from,
      query: slashStateRef.current.query,
    });
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
      handleKeyDown: (view, event) => {
        if (event.key === 'Backspace') {
          const { state } = view;
          const { from, to } = state.selection;
          if (from === to) {
            const $from = state.doc.resolve(from);
            const nodeBefore = $from.nodeBefore;
            if (
              nodeBefore &&
              nodeBefore.type.name === FUNCTION_START_NODE_TYPE
            ) {
              const fnId = nodeBefore.attrs.id as string;
              const fnStartPos = from - nodeBefore.nodeSize;
              let fnEndPos = -1;
              state.doc.descendants((node, pos) => {
                if (
                  node.type.name === FUNCTION_END_NODE_TYPE &&
                  node.attrs.openId === fnId
                ) {
                  fnEndPos = pos;
                }
              });
              const deleteTo = fnEndPos >= 0 ? fnEndPos + 1 : from;
              view.dispatch(state.tr.delete(fnStartPos, deleteTo));
              return true;
            }
          }
        }

        const isArrow = event.key === 'ArrowRight' || event.key === 'ArrowLeft';
        if (isArrow && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
          const { state } = view;
          const { from, to } = state.selection;
          if (from === to) {
            if (event.key === 'ArrowRight') {
              let pos = from;
              // Skip a leading ZWS separator character
              if (docCharAt(state.doc, pos) === ZWS_CHAR) pos++;
              // Skip a structural badge node
              const nodeAfter = state.doc.nodeAt(pos);
              if (nodeAfter && isFormulaStructureNode(nodeAfter.type.name)) {
                pos += nodeAfter.nodeSize;
                // Skip the ZWS that follows the badge
                if (docCharAt(state.doc, pos) === ZWS_CHAR) pos++;
              }
              if (pos !== from) {
                view.dispatch(
                  state.tr.setSelection(TextSelection.create(state.doc, pos)),
                );
                return true;
              }
            } else {
              let pos = from;
              // Skip a trailing ZWS separator character
              if (docCharAt(state.doc, pos - 1) === ZWS_CHAR) pos--;
              // Skip a structural badge node
              const nodeBefore = state.doc.resolve(pos).nodeBefore;
              if (nodeBefore && isFormulaStructureNode(nodeBefore.type.name)) {
                pos -= nodeBefore.nodeSize;
                // Skip the ZWS that precedes the badge
                if (docCharAt(state.doc, pos - 1) === ZWS_CHAR) pos--;
              }
              if (pos !== from) {
                view.dispatch(
                  state.tr.setSelection(TextSelection.create(state.doc, pos)),
                );
                return true;
              }
            }
          }
        }

        if (event.key === ';') {
          const { state } = view;
          const { from, to } = state.selection;

          // Walk from doc start to cursor, tracking function nesting depth.
          // If depth > 0 the cursor is inside a function — insert a sep node.
          let depth = 0;
          let currentOpenId: string | null = null;
          state.doc.nodesBetween(0, from, (node) => {
            if (node.type.name === FUNCTION_START_NODE_TYPE) {
              depth++;
              currentOpenId = node.attrs.id as string;
            }
            if (node.type.name === FUNCTION_END_NODE_TYPE) {
              depth--;
              if (depth === 0) currentOpenId = null;
            }
          });

          if (depth <= 0 || !currentOpenId) return false;

          const { tr } = state;
          const sepNode = state.schema.nodes[FUNCTION_SEP_NODE_TYPE].create({
            openId: currentOpenId,
          });
          const zwsText = state.schema.text(ZWS_CHAR);
          tr.replaceWith(from, to, Fragment.fromArray([sepNode, zwsText]));
          view.dispatch(tr);
          return true;
        }

        if (event.key !== ')') return false;

        const { state } = view;

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
        if (unclosed.length === 0) return false;

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

        const { tr } = state;
        const endNode = state.schema.nodes[FUNCTION_END_NODE_TYPE].create({
          openId: innermostId,
        });
        view.dispatch(tr.replaceSelectionWith(endNode));
        return true;
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
      setHasFunctions(docHasFunctions(e));
      setTypeErrors(collectTypeErrors(editorContent));
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
      const nowHasFunctions = docHasFunctions(e);
      setHasFunctions(nowHasFunctions);
      setTypeErrors(collectTypeErrors(editorContent));
      if (isFocusedRef.current && nowHasFunctions) updatePreview(textResult);
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
      setIsFocused(false);
      editorWrapperRef.current
        ?.querySelectorAll('.ap-fn-cursor-active')
        .forEach((n) => n.classList.remove('ap-fn-cursor-active'));
    },
    onFocus: ({ editor: e }) => {
      setIsFocused(true);
      setInsertMentionHandler(insertMention);
      if (hasFunctionsRef.current) {
        const text = textMentionUtils.convertTiptapJsonToText(e.getJSON());
        updatePreview(text);
      }
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    setSlashCommandHandler({
      editor,
      handler: {
        getState: () => slashStateRef.current,
        setState: setSlashState,
      },
    });
    return () => {
      setSlashCommandHandler({ editor, handler: null });
    };
  }, [editor]);

  const updatePreview = useCallback(
    (expression: string) => {
      const flatData = flattenSampleData(sampleData ?? {});
      const { result, error } = formulaEvaluator.evaluate({
        expression,
        sampleData: flatData,
      });
      setPreviewErrorMsg(error);
      setPreviewResult(result != null ? formatPreviewResult(result) : '');
    },
    [sampleData],
  );

  if (!editor) return null;

  const showPreview = isFocused && hasFunctions;

  return (
    <div className="relative w-full" ref={editorWrapperRef}>
      <EditorContent editor={editor} />

      {showPreview && (
        <div
          className="absolute left-0 right-0 top-full z-50 rounded-b-md border border-t-0 border-border bg-background shadow-md text-[13px]"
          onMouseDown={(e) => e.preventDefault()}
        >
          {(typeErrors.length > 0 || previewErrorMsg) && (
            <div className="border-b border-border">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="flex items-center gap-1.5 text-destructive font-medium text-xs">
                  <XCircle className="size-3" />
                  {t('Error')}
                </span>
                <CopyButton
                  variant="ghost"
                  size="icon-xs"
                  withoutTooltip
                  textToCopy={[...typeErrors, previewErrorMsg ?? '']
                    .filter(Boolean)
                    .join('\n')}
                />
              </div>
              <div className="px-3 pb-2 text-destructive break-all whitespace-pre-wrap space-y-0.5">
                {typeErrors.map((err, i) => (
                  <div key={i}>{err}</div>
                ))}
                {previewErrorMsg && <div>{previewErrorMsg}</div>}
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between px-3 py-2">
              <span className="flex items-center gap-1.5 font-medium text-xs">
                <ChevronRight className="size-3" />
                {t('Preview')}
              </span>
              <CopyButton
                variant="ghost"
                size="icon-xs"
                withoutTooltip
                textToCopy={previewResult}
              />
            </div>

            <div className="px-3 pb-2 text-foreground break-all whitespace-pre-wrap">
              {previewResult || (
                <span className="text-muted-foreground italic">
                  {t('empty')}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <FunctionEditorTooltip editorRef={editorWrapperRef} activeFn={activeFn} />

      {slashState.open && (
        <FunctionSearchPopover
          query={slashState.query}
          position={slashState.position}
          editorRef={editorWrapperRef}
          onSelect={handleFunctionSelect}
          onClose={closeSlash}
        />
      )}
    </div>
  );
};

const ZWS_CHAR = '\u200B';

function docCharAt(doc: import('@tiptap/pm/model').Node, pos: number): string {
  if (pos < 0 || pos >= doc.content.size) return '';
  try {
    return doc.textBetween(pos, pos + 1, '', '');
  } catch {
    return '';
  }
}

function isFormulaStructureNode(typeName: string): boolean {
  return (
    typeName === FUNCTION_START_NODE_TYPE ||
    typeName === FUNCTION_SEP_NODE_TYPE ||
    typeName === FUNCTION_END_NODE_TYPE
  );
}

function collectTypeErrors(doc: import('@tiptap/react').JSONContent): string[] {
  const errors = typeCheckTiptapDoc(doc);
  return [...new Set(errors.values())].filter(Boolean);
}

function docHasFunctions(editor: import('@tiptap/react').Editor): boolean {
  let found = false;
  editor.state.doc.descendants((node) => {
    if (node.type.name === FUNCTION_START_NODE_TYPE) found = true;
  });
  return found;
}

function formatPreviewResult(value: unknown): string {
  if (typeof value === 'object') return JSON.stringify(value, null, 2);
  return String(value);
}

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

  wrapperEl
    .querySelectorAll<HTMLElement>('[data-function-sep]')
    .forEach((badge) => {
      const openId = badge.getAttribute('data-function-sep');
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

  let innermostId: string | null = null;
  let innermostPos = -1;

  for (const [id, { pos }] of startMap) {
    if (pos >= cursorPos) continue;
    const endPos = endMap.has(id) ? endMap.get(id)! : Infinity;
    if (cursorPos > endPos) continue;
    if (pos > innermostPos) {
      innermostId = id;
      innermostPos = pos;
    }
  }

  if (!innermostId) return null;

  const { functionName } = startMap.get(innermostId)!;

  let argIndex = 0;
  let depth = 0;

  state.doc.descendants((node, pos) => {
    if (pos <= innermostPos) return;
    if (pos >= cursorPos) return;

    if (node.type.name === FUNCTION_START_NODE_TYPE) {
      depth++;
    } else if (node.type.name === FUNCTION_END_NODE_TYPE) {
      if (depth > 0) depth--;
    } else if (node.type.name === FUNCTION_SEP_NODE_TYPE && depth === 0) {
      argIndex++;
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
