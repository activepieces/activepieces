import { json } from '@codemirror/lang-json';
import { githubDark, githubLight } from '@uiw/codemirror-theme-github';
import CodeMirror, {
  EditorState,
  EditorView,
  ReactCodeMirrorRef,
} from '@uiw/react-codemirror';
import React, { RefObject, useRef, useState } from 'react';
import { ControllerRenderProps } from 'react-hook-form';

import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

const styleTheme = EditorView.baseTheme({
  '&.cm-editor.cm-focused': {
    outline: 'none',
  },
});

const convertToString = (value: unknown): string => {
  if (typeof value === 'string') {
    return value;
  }
  return JSON.stringify(value, null, 2);
};

const tryParseJson = (value: unknown): unknown => {
  if (typeof value !== 'string') {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch (e) {
    return value;
  }
};

type JsonEditorProps = {
  field: ControllerRenderProps<Record<string, any>, string>;
  readonly: boolean;
  onFocus?: (ref: RefObject<ReactCodeMirrorRef>) => void;
  className?: string;
};

const JsonEditor = React.memo(
  ({ field, readonly, onFocus, className }: JsonEditorProps) => {
    const [value, setValue] = useState(convertToString(field.value));
    const { theme } = useTheme();
    const editorTheme = theme === 'dark' ? githubDark : githubLight;
    const extensions = [
      styleTheme,
      EditorState.readOnly.of(readonly),
      EditorView.editable.of(!readonly),
      EditorView.lineWrapping,
      json(),
    ];
    const ref = useRef<ReactCodeMirrorRef>(null);
    return (
      <div className="flex flex-col gap-2 border rounded py-2 px-2">
        <CodeMirror
          ref={ref}
          value={value}
          className={cn('border-none', className)}
          height="250px"
          width="100%"
          maxWidth="100%"
          basicSetup={{
            foldGutter: false,
            lineNumbers: true,
            searchKeymap: false,
            lintKeymap: true,
            autocompletion: true,
          }}
          lang="json"
          onChange={(value) => {
            setValue(value);
            // Wrap in event-like object to prevent RHF from breaking when
            // the dictionary has a "target" key. RHF's getEventValue extracts
            // target.value from event-like objects, so this ensures the actual
            // dictionary value is preserved.
            // See: https://github.com/react-hook-form/react-hook-form/issues/13078
            field.onChange({ target: { value: tryParseJson(value) } });
          }}
          theme={editorTheme}
          readOnly={readonly}
          onFocus={() => onFocus?.(ref)}
          extensions={extensions}
        />
      </div>
    );
  },
);

JsonEditor.displayName = 'JsonEditor';
export { JsonEditor };
