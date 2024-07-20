import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { githubLight } from '@uiw/codemirror-theme-github';
import CodeMirror, { EditorState, EditorView } from '@uiw/react-codemirror';

const styleTheme = EditorView.baseTheme({
  '&.cm-editor.cm-focused': {
    outline: 'none',
  },
});

type CodeEditorProps = {
  code: string;
  onChange: (code: string) => void;
  readonly: boolean;
  language: 'typescript' | 'json';
};

const CodeEditior = ({
  code,
  readonly,
  onChange,
  language,
}: CodeEditorProps) => {
  const extensions = [
    styleTheme,
    EditorState.readOnly.of(readonly),
    EditorView.editable.of(!readonly),
    language === 'json' ? json() : javascript({ jsx: false, typescript: true }),
  ];

  return (
    <div className="flex flex-col gap-2 border rounded p-2">
      <div className="text-md">Code</div>
      <CodeMirror
        value={code}
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
        lang="typescript"
        onChange={(value) => {
          onChange(value);
        }}
        theme={githubLight}
        readOnly={readonly}
        extensions={extensions}
      />
    </div>
  );
};

export { CodeEditior };
