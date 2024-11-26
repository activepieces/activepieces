import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { githubDark, githubLight } from '@uiw/codemirror-theme-github';
import CodeMirror, { EditorState, EditorView } from '@uiw/react-codemirror';
import { t } from 'i18next';
import { BetweenHorizontalEnd, Package } from 'lucide-react';
import { useState } from 'react';

import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { flagsHooks } from '@/hooks/flags-hooks';
import { cn } from '@/lib/utils';
import { ApFlagId, SourceCode, deepMergeAndCast } from '@activepieces/shared';

import { AddNpmDialog } from './add-npm-dialog';

const styleTheme = EditorView.baseTheme({
  '&.cm-editor.cm-focused': {
    outline: 'none',
  },
});

type CodeEditorProps = {
  sourceCode: SourceCode;
  onChange: (sourceCode: SourceCode) => void;
  readonly: boolean;
  applyCodeToCurrentStep?: () => void;
};

const CodeEditor = ({
  sourceCode,
  readonly,
  onChange,
  applyCodeToCurrentStep,
}: CodeEditorProps) => {
  const { code, packageJson } = sourceCode;
  const [activeTab, setActiveTab] = useState<keyof SourceCode>('code');
  const [language, setLanguage] = useState<'typescript' | 'json'>('typescript');
  const codeApplicationEnabled = typeof applyCodeToCurrentStep === 'function';
  const { theme } = useTheme();

  const codeEditorTheme = theme === 'dark' ? githubDark : githubLight;

  const { data: allowNpmPackagesInCodeStep } = flagsHooks.useFlag<boolean>(
    ApFlagId.ALLOW_NPM_PACKAGES_IN_CODE_STEP,
  );

  const extensions = [
    styleTheme,
    EditorState.readOnly.of(readonly),
    EditorView.editable.of(!readonly),
    language === 'json' ? json() : javascript({ jsx: false, typescript: true }),
  ];

  function handlePackageClick() {
    setActiveTab('packageJson');
    setLanguage('json');
  }

  function handleCodeClick() {
    setActiveTab('code');
    setLanguage('typescript');
  }

  function handleAddPackages(packageName: string, packageVersion: string) {
    try {
      const json = deepMergeAndCast(JSON.parse(packageJson), {
        dependencies: {
          [packageName]: packageVersion,
        },
      });
      setActiveTab('packageJson');
      onChange({ code, packageJson: JSON.stringify(json, null, 2) });
    } catch (e) {
      console.error(e);
      toast(INTERNAL_ERROR_TOAST);
    }
  }

  return (
    <div className="flex flex-col gap-2 border rounded py-2 px-2">
      <div className="flex flex-row justify-center items-center h-full">
        <div className="flex justify-start gap-4 items-center">
          <div
            className={cn('text-sm cursor-pointer', {
              'font-bold': activeTab === 'code',
            })}
            onClick={() => handleCodeClick()}
          >
            {t('Code')}
          </div>
          {allowNpmPackagesInCodeStep && (
            <div
              className={cn('text-sm cursor-pointer', {
                'font-bold': activeTab === 'packageJson',
              })}
              onClick={() => handlePackageClick()}
            >
              {t('Dependencies')}
            </div>
          )}
        </div>
        <div className="flex flex-grow"></div>
        {codeApplicationEnabled ? (
          <Button
            variant="outline"
            className="flex gap-2"
            size={'sm'}
            onClick={applyCodeToCurrentStep}
          >
            <BetweenHorizontalEnd className="w-3 h-3" />
            {t('Apply code')}
          </Button>
        ) : (
          allowNpmPackagesInCodeStep && (
            <AddNpmDialog onAdd={handleAddPackages}>
              <Button
                variant="outline"
                className="flex gap-2"
                size={'sm'}
                onClick={() => {}}
              >
                <Package className="w-4 h-4" />
                {t('Add package')}
              </Button>
            </AddNpmDialog>
          )
        )}
      </div>
      <CodeMirror
        value={activeTab === 'code' ? code : packageJson}
        className="border-none"
        minHeight="250px"
        width="100%"
        height="100%"
        maxWidth="100%"
        basicSetup={{
          foldGutter: true,
          lineNumbers: true,
          searchKeymap: false,
          lintKeymap: true,
          autocompletion: true,
          foldKeymap: true,
        }}
        lang="typescript"
        onChange={(value) => {
          onChange(
            activeTab === 'code'
              ? { code: value, packageJson }
              : { code, packageJson: value },
          );
        }}
        theme={codeEditorTheme}
        readOnly={readonly}
        extensions={extensions}
      />
    </div>
  );
};

export { CodeEditor };
