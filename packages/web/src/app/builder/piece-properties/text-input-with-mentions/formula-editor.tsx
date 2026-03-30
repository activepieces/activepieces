import {
  evaluateExpression,
  flowStructureUtil,
  isNil,
} from '@activepieces/shared';
import { closeBrackets } from '@codemirror/autocomplete';
import { EditorView } from '@codemirror/view';
import CodeMirror from '@uiw/react-codemirror';
import React, { useCallback, useMemo, useRef, useState } from 'react';

import { inputClass } from '@/components/ui/input';
import { stepsHooks } from '@/features/pieces';
import { cn } from '@/lib/utils';

import { useBuilderStateContext } from '../../builder-hooks';

import { formulaAutocompleteExtension } from './formula-extensions/formula-autocomplete';
import { formulaLintExtension } from './formula-extensions/formula-lint';
import { functionHighlightExtension } from './formula-extensions/function-highlight';
import { variablePillExtension } from './formula-extensions/variable-pill';
import { textMentionUtils } from './text-input-utils';

type FormulaEditorProps = {
  className?: string;
  initialValue?: unknown;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  enableMarkdown?: boolean;
};

const editorTheme = EditorView.baseTheme({
  '&.cm-editor.cm-focused': { outline: 'none' },
  '&.cm-editor': { outline: 'none' },
});

export const FormulaEditor = ({
  className,
  initialValue,
  onChange,
  disabled,
  placeholder,
}: FormulaEditorProps) => {
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

  const [previewMode, setPreviewMode] = useState(false);
  const [previewValue, setPreviewValue] = useState<string>('');
  const [previewError, setPreviewError] = useState(false);

  const editorViewRef = useRef<EditorView | null>(null);

  const labelLookupRef = useRef<(path: string) => string>(() => '');
  labelLookupRef.current = (path: string) => {
    const mention = `{{${path}}}`;
    const parsed = textMentionUtils.parseLabelFromMention(
      mention,
      steps,
      stepsMetadata,
    );
    return parsed.displayText;
  };

  const extensions = useMemo(
    () => [
      editorTheme,
      EditorView.lineWrapping,
      EditorView.editable.of(!disabled),
      variablePillExtension((path) => labelLookupRef.current(path)),
      ...functionHighlightExtension(),
      formulaLintExtension(),
      formulaAutocompleteExtension(),
      closeBrackets(),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [disabled],
  );

  const docValue = convertToText(initialValue);

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
    if (!previewMode) {
      const currentText = editorViewRef.current
        ? editorViewRef.current.state.doc.toString()
        : docValue;
      updatePreview(currentText);
    }
    setPreviewMode((prev) => !prev);
  };

  const handleChange = useCallback(
    (value: string) => {
      onChange(value);
      if (previewMode) {
        updatePreview(value);
      }
    },
    [onChange, previewMode, updatePreview],
  );

  const handleFocus = useCallback(() => {
    setInsertMentionHandler((propertyPath: string) => {
      const view = editorViewRef.current;
      if (!view) return;
      view.dispatch(view.state.replaceSelection(`{{${propertyPath}}}`));
    });
  }, [setInsertMentionHandler]);

  const wrapperClass = cn(
    className ?? cn(inputClass, 'py-2 h-[unset] block min-h-9'),
  );

  return (
    <div className="w-full">
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
        <div
          className={cn(
            wrapperClass,
            'formula-editor !p-0',
            textMentionUtils.inputWithMentionsCssClass,
          )}
        >
          <CodeMirror
            value={docValue}
            onChange={handleChange}
            onFocus={handleFocus}
            extensions={extensions}
            basicSetup={{
              lineNumbers: false,
              foldGutter: false,
              highlightActiveLine: false,
              searchKeymap: false,
              autocompletion: false,
            }}
            placeholder={placeholder}
            editable={!disabled}
            className={cn('text-sm', {
              'cursor-not-allowed opacity-50': disabled,
            })}
            onCreateEditor={(view) => {
              editorViewRef.current = view;
            }}
          />
        </div>
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
