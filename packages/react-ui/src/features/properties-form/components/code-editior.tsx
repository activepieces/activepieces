import CodeMirror, { EditorView, keymap } from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { githubLight } from '@uiw/codemirror-theme-github';

const styleTheme = EditorView.baseTheme({
    "&.cm-editor.cm-focused": {
        outline: "none",
    }
})
const CodeEditior = ({ code, onChange }: { code: string, onChange: (code: string) => void }) => {
    return <div className="flex flex-col gap-2 border rounded p-2">
        <div className="text-md">
            Code
        </div>
       <CodeMirror
        value={code}
        className='border-none'
        height="250px"
        width='100%'
        maxWidth='100%'
        basicSetup={{
            foldGutter: false,
            lineNumbers: true,
            searchKeymap: false,
            lintKeymap: true,
            autocompletion: true,
        }}
        lang='typescript'
        onChange={(value, viewUpdate) => {
            onChange(value);
        }}
        theme={githubLight}
        extensions={[
            styleTheme, 
            javascript({ jsx: false, typescript: true }),
        ]}
    />
    </div>
}

export { CodeEditior };