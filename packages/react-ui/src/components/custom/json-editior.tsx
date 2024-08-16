import { json } from '@codemirror/lang-json';
import { githubLight } from '@uiw/codemirror-theme-github';
import CodeMirror, { EditorState, EditorView } from '@uiw/react-codemirror';
import React, { useState } from 'react';
import { ControllerRenderProps } from 'react-hook-form';

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
};

const JsonEditor = React.memo(({ field, readonly }: JsonEditorProps) => {
  const [value, setValue] = useState(convertToString(field.value));
  const extensions = [
    styleTheme,
    EditorState.readOnly.of(readonly),
    EditorView.editable.of(!readonly),
    json(),
  ];

  return (
    <div className="flex flex-col gap-2 border rounded py-2 px-2">
      <CodeMirror
        value={value}
        className="border-none"
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
          field.onChange(tryParseJson(value));
        }}
        theme={githubLight}
        readOnly={readonly}
        extensions={extensions}
      />
    </div>
  );
});

JsonEditor.displayName = 'JsonEditor';
export { JsonEditor };