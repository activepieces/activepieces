import { loader, Editor, OnMount } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import EditorWorker from 'monaco-editor/editor/editor.worker?worker';
import JsonWorker from 'monaco-editor/languages/features/json/json.worker?worker';
import TsWorker from 'monaco-editor/languages/features/typescript/ts.worker?worker';
import { useRef } from 'react';

import { cn } from '@/lib/utils';

const COMPACT_MAX_HEIGHT_PX = 420;
const COMPACT_MIN_HEIGHT_PX = 180;
const CANNOT_FIND_MODULE_CODES = [2307, 2792];
const ESCAPE_CONTEXT =
  '!suggestWidgetVisible && !findWidgetVisible && !parameterHintsVisible && !renameInputVisible && !inSnippetMode && !editorHasMultipleSelections && !editorHasSelection';

const SHARED_OPTIONS: monaco.editor.IStandaloneEditorConstructionOptions = {
  automaticLayout: true,
  tabSize: 2,
  wordWrap: 'on',
  fixedOverflowWidgets: true,
  bracketPairColorization: { enabled: true },
};

const COMPACT_OPTIONS: monaco.editor.IStandaloneEditorConstructionOptions = {
  fontSize: 12,
  lineHeight: 18,
  padding: { top: 6, bottom: 6 },
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  glyphMargin: false,
  lineNumbersMinChars: 3,
  lineDecorationsWidth: 6,
  folding: true,
  showFoldingControls: 'mouseover',
  overviewRulerLanes: 0,
  overviewRulerBorder: false,
  hideCursorInOverviewRuler: true,
  renderLineHighlight: 'none',
  stickyScroll: { enabled: false },
  scrollbar: {
    alwaysConsumeMouseWheel: false,
    verticalScrollbarSize: 8,
    horizontalScrollbarSize: 8,
  },
};

const FULLSCREEN_OPTIONS: monaco.editor.IStandaloneEditorConstructionOptions = {
  fontSize: 14,
  lineHeight: 22,
  padding: { top: 12, bottom: 12 },
  minimap: { enabled: true, renderCharacters: false },
  scrollBeyondLastLine: true,
  glyphMargin: true,
  lineNumbersMinChars: 4,
  folding: true,
  showFoldingControls: 'always',
  stickyScroll: { enabled: true },
  smoothScrolling: true,
  cursorSmoothCaretAnimation: 'on',
};

function createWorker(_workerId: string, label: string): Worker {
  if (label === 'json') {
    return new JsonWorker();
  }
  if (label === 'typescript' || label === 'javascript') {
    return new TsWorker();
  }
  return new EditorWorker();
}

function configureMonaco() {
  self.MonacoEnvironment = { getWorker: createWorker };
  loader.config({ monaco });
  monaco.typescript.typescriptDefaults.setDiagnosticsOptions({
    diagnosticCodesToIgnore: CANNOT_FIND_MODULE_CODES,
  });
  monaco.typescript.typescriptDefaults.setCompilerOptions({
    target: monaco.typescript.ScriptTarget.ES2020,
    module: monaco.typescript.ModuleKind.ESNext,
    moduleResolution: monaco.typescript.ModuleResolutionKind.NodeJs,
    allowNonTsExtensions: true,
    noEmit: true,
  });
}

configureMonaco();

function MonacoEditorPane({
  value,
  path,
  language,
  readOnly,
  theme,
  mode,
  minHeightPx,
  onChange,
  onReady,
  onToggleFullscreen,
}: MonacoEditorPaneProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isCompact = mode === 'compact';
  const minHeight = minHeightPx ?? COMPACT_MIN_HEIGHT_PX;

  const handleMount: OnMount = (codeEditor) => {
    const actions = [
      codeEditor.addAction({
        id: 'toggle-fullscreen',
        label: 'Toggle Full Screen',
        keybindings: [monaco.KeyCode.F11],
        run: onToggleFullscreen,
      }),
      ...(isCompact
        ? []
        : [
            codeEditor.addAction({
              id: 'exit-fullscreen',
              label: 'Exit Full Screen',
              keybindings: [monaco.KeyCode.Escape],
              precondition: ESCAPE_CONTEXT,
              run: onToggleFullscreen,
            }),
          ]),
    ];
    codeEditor.onDidDispose(() =>
      actions.forEach((action) => action.dispose()),
    );
    if (isCompact) {
      const resize = () => {
        const container = containerRef.current;
        if (!container) {
          return;
        }
        const height = Math.min(
          Math.max(codeEditor.getContentHeight(), minHeight),
          COMPACT_MAX_HEIGHT_PX,
        );
        container.style.height = `${height}px`;
        codeEditor.layout();
      };
      codeEditor.onDidContentSizeChange(resize);
      resize();
    } else {
      codeEditor.focus();
    }
    onReady(codeEditor);
  };

  return (
    <div
      ref={containerRef}
      className={cn('w-full overflow-hidden', { 'h-full': !isCompact })}
      style={isCompact ? { height: minHeight } : undefined}
    >
      <Editor
        path={path}
        language={language}
        value={value}
        theme={theme}
        keepCurrentModel
        onChange={(newValue) => onChange(newValue ?? '')}
        onMount={handleMount}
        options={{
          ...SHARED_OPTIONS,
          ...(isCompact ? COMPACT_OPTIONS : FULLSCREEN_OPTIONS),
          readOnly,
        }}
      />
    </div>
  );
}

function disposeEditorModels({ pathPrefix }: { pathPrefix: string }) {
  monaco.editor
    .getModels()
    .filter((model) => model.uri.toString().startsWith(pathPrefix))
    .forEach((model) => model.dispose());
}

export default MonacoEditorPane;
export { disposeEditorModels };

export type MonacoEditorPaneProps = {
  value: string;
  path: string;
  language: 'typescript' | 'json';
  readOnly: boolean;
  theme: 'vs' | 'vs-dark';
  mode: 'compact' | 'fullscreen';
  minHeightPx?: number;
  onChange: (value: string) => void;
  onReady: (editor: monaco.editor.IStandaloneCodeEditor) => void;
  onToggleFullscreen: () => void;
};
