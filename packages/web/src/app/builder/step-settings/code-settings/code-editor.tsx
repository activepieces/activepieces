import { deepMergeAndCast } from '@activepieces/core-utils';
import { ApFlagId, SourceCode } from '@activepieces/shared';
import { t } from 'i18next';
import {
  Code,
  Maximize2,
  Minimize2,
  Package,
  WandSparkles,
} from 'lucide-react';
import type { editor } from 'monaco-editor';
import { lazy, Suspense, useEffect, useId, useRef, useState } from 'react';

import { useTheme } from '@/components/providers/theme-provider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { internalErrorToast } from '@/components/ui/sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { flagsHooks } from '@/hooks/flags-hooks';
import { syntaxTheme } from '@/lib/syntax-theme';
import { cn } from '@/lib/utils';

import { AddNpmDialog } from './add-npm-dialog';

const MonacoEditorPane = lazy(() => import('./monaco-editor-pane'));

const CodeEditor = ({
  sourceCode,
  readonly,
  onChange,
  applyCodeToCurrentStep,
  minHeight,
}: CodeEditorProps) => {
  const { code, packageJson } = sourceCode;
  const [activeTab, setActiveTab] = useState<keyof SourceCode>('code');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { resolvedTheme } = useTheme();
  const monacoEditorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const isMountedRef = useRef(false);
  const editorId = useId().replace(/:/g, '');

  useEffect(() => {
    isMountedRef.current = true;
    const pathPrefix = `file:///${editorId}/`;
    return () => {
      isMountedRef.current = false;
      setTimeout(() => {
        if (isMountedRef.current) {
          return;
        }
        import('./monaco-editor-pane')
          .then((pane) => pane.disposeEditorModels({ pathPrefix }))
          .catch(() => undefined);
      }, 0);
    };
  }, [editorId]);

  const { data: allowNpmPackagesInCodeStep } = flagsHooks.useFlag<boolean>(
    ApFlagId.ALLOW_NPM_PACKAGES_IN_CODE_STEP,
  );

  const isCodeTab = activeTab === 'code';

  function handleFormat() {
    monacoEditorRef.current
      ?.getAction('editor.action.formatDocument')
      ?.run()
      .catch(() => undefined);
  }

  function handleToggleFullscreen() {
    setIsFullscreen((current) => !current);
  }

  function handleAddPackages({
    packageName,
    packageVersion,
  }: {
    packageName: string;
    packageVersion: string;
  }) {
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
      internalErrorToast();
    }
  }

  function renderToolbar({ fullscreen }: { fullscreen: boolean }) {
    return (
      <CodeEditorToolbar
        activeTab={activeTab}
        showDependenciesTab={!!allowNpmPackagesInCodeStep}
        readonly={readonly}
        isFullscreen={fullscreen}
        applyCodeToCurrentStep={applyCodeToCurrentStep}
        onSelectTab={setActiveTab}
        onFormat={handleFormat}
        onToggleFullscreen={handleToggleFullscreen}
        onAddPackage={handleAddPackages}
      />
    );
  }

  function renderPane({ fullscreen }: { fullscreen: boolean }) {
    return (
      <Suspense
        fallback={<Skeleton className="w-full h-[180px] rounded-none" />}
      >
        <MonacoEditorPane
          path={`file:///${editorId}/${
            isCodeTab ? 'index.ts' : 'package.json'
          }`}
          language={isCodeTab ? 'typescript' : 'json'}
          value={isCodeTab ? code : packageJson}
          readOnly={readonly}
          theme={syntaxTheme.monaco(resolvedTheme)}
          mode={fullscreen ? 'fullscreen' : 'compact'}
          minHeightPx={minHeight ? parseInt(minHeight, 10) : undefined}
          onChange={(value) => {
            onChange(
              isCodeTab
                ? { code: value, packageJson }
                : { code, packageJson: value },
            );
          }}
          onReady={(monacoEditor) => {
            monacoEditorRef.current = monacoEditor;
          }}
          onToggleFullscreen={handleToggleFullscreen}
        />
      </Suspense>
    );
  }

  return (
    <div className="flex flex-col border rounded-md overflow-hidden bg-background">
      {renderToolbar({ fullscreen: false })}
      {isFullscreen ? (
        <div className="h-[180px] border-t" />
      ) : (
        <div className="border-t">{renderPane({ fullscreen: false })}</div>
      )}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent
          showCloseButton={false}
          aria-describedby={undefined}
          className="flex flex-col gap-0 p-0 max-w-none w-[96vw] h-[92vh] overflow-hidden"
          onOpenAutoFocus={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => {
            if (
              event.target instanceof Element &&
              event.target.closest('.monaco-editor')
            ) {
              event.preventDefault();
            }
          }}
        >
          <DialogTitle className="sr-only">{t('Code')}</DialogTitle>
          {renderToolbar({ fullscreen: true })}
          <div className="flex-1 min-h-0 border-t">
            {renderPane({ fullscreen: true })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

function CodeEditorToolbar({
  activeTab,
  showDependenciesTab,
  readonly,
  isFullscreen,
  applyCodeToCurrentStep,
  onSelectTab,
  onFormat,
  onToggleFullscreen,
  onAddPackage,
}: CodeEditorToolbarProps) {
  const fullscreenLabel = isFullscreen
    ? t('Exit full screen')
    : t('Full screen');

  return (
    <div className="flex items-center gap-1 px-2 py-1.5">
      <ToolbarTab
        label={t('Code')}
        active={activeTab === 'code'}
        onClick={() => onSelectTab('code')}
      />
      {showDependenciesTab && (
        <ToolbarTab
          label={t('Dependencies')}
          active={activeTab === 'packageJson'}
          onClick={() => onSelectTab('packageJson')}
        />
      )}
      <div className="flex grow" />
      {!readonly && (
        <ToolbarIconButton
          label={`${t('Format code')} (Shift+Alt+F)`}
          onClick={onFormat}
        >
          <WandSparkles className="size-3.5" />
        </ToolbarIconButton>
      )}
      <ToolbarIconButton
        label={`${fullscreenLabel} (F11)`}
        onClick={onToggleFullscreen}
      >
        {isFullscreen ? (
          <Minimize2 className="size-3.5" />
        ) : (
          <Maximize2 className="size-3.5" />
        )}
      </ToolbarIconButton>
      {typeof applyCodeToCurrentStep === 'function' ? (
        <Button
          variant="outline"
          className="flex gap-2"
          size="xs"
          onClick={applyCodeToCurrentStep}
        >
          <Code className="w-3 h-3" />
          {t('Use code')}
        </Button>
      ) : (
        showDependenciesTab && (
          <AddNpmDialog onAdd={onAddPackage}>
            <Button variant="outline" className="flex gap-2" size="xs">
              <Package className="w-3 h-3" />
              {t('Add package')}
            </Button>
          </AddNpmDialog>
        )
      )}
    </div>
  );
}

function ToolbarTab({ label, active, onClick }: ToolbarTabProps) {
  return (
    <button
      type="button"
      className={cn(
        'text-xs px-2 py-1 rounded-md transition-colors text-muted-foreground hover:text-foreground',
        { 'bg-accent text-foreground font-medium': active },
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function ToolbarIconButton({
  label,
  onClick,
  children,
}: ToolbarIconButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          aria-label={label}
          onClick={onClick}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

export { CodeEditor };

type CodeEditorProps = {
  sourceCode: SourceCode;
  onChange: (sourceCode: SourceCode) => void;
  readonly: boolean;
  applyCodeToCurrentStep?: () => void;
  minHeight?: string;
};

type CodeEditorToolbarProps = {
  activeTab: keyof SourceCode;
  showDependenciesTab: boolean;
  readonly: boolean;
  isFullscreen: boolean;
  applyCodeToCurrentStep?: () => void;
  onSelectTab: (tab: keyof SourceCode) => void;
  onFormat: () => void;
  onToggleFullscreen: () => void;
  onAddPackage: (params: {
    packageName: string;
    packageVersion: string;
  }) => void;
};

type ToolbarTabProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

type ToolbarIconButtonProps = {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
};
