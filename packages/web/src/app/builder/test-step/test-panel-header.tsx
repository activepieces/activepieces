import { StepOutputStatus } from '@activepieces/shared';
import { t } from 'i18next';
import { Columns2, Copy, Download, Minus, Play, Rows2 } from 'lucide-react';
import { toast } from 'sonner';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { StepStatusIcon } from '@/features/flow-runs';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

type TestPanelHeaderProps = {
  status: 'success' | 'failed' | 'testing' | 'idle';
  lastTestDate?: string | null;
  onRetest?: () => void;
  retestDisabled?: boolean;
  retestLoading?: boolean;
  copyableData?: unknown;
  dataLabel?: string;
  downloadFileName?: string;
  hideRetest?: boolean;
  hideClose?: boolean;
};

const TestPanelHeader = ({
  status,
  lastTestDate,
  onRetest,
  retestDisabled = false,
  retestLoading = false,
  copyableData,
  dataLabel,
  downloadFileName = 'data',
  hideRetest = false,
  hideClose = false,
}: TestPanelHeaderProps) => {
  const [testPanelView, setTestPanelView, setTestPanelOpen] =
    useBuilderStateContext((state) => [
      state.testPanelView,
      state.setTestPanelView,
      state.setTestPanelOpen,
    ]);

  const handleCopy = () => {
    if (copyableData === undefined) return;
    navigator.clipboard.writeText(
      typeof copyableData === 'string'
        ? copyableData
        : JSON.stringify(copyableData, null, 2),
    );
    toast.success(t('Copied to clipboard'), { duration: 1000 });
  };

  const handleDownload = () => {
    if (copyableData === undefined) return;
    const isPlainString = typeof copyableData === 'string';
    const text = isPlainString
      ? copyableData
      : JSON.stringify(copyableData, null, 2);
    const mimeType = isPlainString ? 'text/plain' : 'application/json';
    const extension = isPlainString ? 'txt' : 'json';
    const blob = new Blob([text], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${downloadFileName}.${extension}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleView = () => {
    setTestPanelView(testPanelView === 'drawer' ? 'split' : 'drawer');
  };

  const switchToDrawer = testPanelView === 'split';
  const ToggleIcon = switchToDrawer ? Rows2 : Columns2;
  const toggleLabel = switchToDrawer
    ? t('Switch to drawer view')
    : t('Switch to split view');

  const canActOnData =
    copyableData !== undefined && copyableData !== null && status !== 'testing';

  const copyTooltip = dataLabel
    ? t('Copy {label}', { label: dataLabel })
    : t('Copy to clipboard');
  const downloadTooltip = dataLabel
    ? t('Download {label}', { label: dataLabel })
    : t('Download JSON');

  return (
    <TooltipProvider>
      <div className="sticky top-0 z-10 flex items-center justify-between px-3 py-2 gap-2 bg-background">
        <div className="flex items-center gap-2 min-w-0">
          <TestPanelStatusBadge status={status} />
          {lastTestDate && status !== 'testing' && (
            <span className="text-xs text-muted-foreground truncate">
              {formatUtils.formatDateWithTime(new Date(lastTestDate), false)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          {!hideRetest && onRetest && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRetest}
                  disabled={retestDisabled || retestLoading}
                  className="text-primary hover:text-primary hover:bg-primary/10"
                  aria-label={t('Re-test step')}
                >
                  <Play className="size-4 fill-current" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">{t('Re-test step')}</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                disabled={!canActOnData}
                aria-label={copyTooltip}
              >
                <Copy className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">{copyTooltip}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDownload}
                disabled={!canActOnData}
                aria-label={downloadTooltip}
              >
                <Download className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">{downloadTooltip}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleView}
                aria-label={toggleLabel}
              >
                <ToggleIcon className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">{toggleLabel}</TooltipContent>
          </Tooltip>
          {!hideClose && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTestPanelOpen(false)}
                  aria-label={t('Minimize')}
                >
                  <Minus className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">{t('Minimize')}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
};

type TestPanelStatusBadgeProps = {
  status: 'success' | 'failed' | 'testing' | 'idle';
};

const TestPanelStatusBadge = ({ status }: TestPanelStatusBadgeProps) => {
  if (status === 'testing') {
    return null;
  }
  if (status === 'failed') {
    return (
      <div className="flex items-center gap-1.5 text-sm text-destructive">
        <StepStatusIcon status={StepOutputStatus.FAILED} size="4.5" />
        <span>{t('Testing Failed')}</span>
      </div>
    );
  }
  if (status === 'success') {
    return (
      <div className="flex items-center gap-1.5 text-sm">
        <StepStatusIcon status={StepOutputStatus.SUCCEEDED} size="4.5" />
        <span className={cn('text-success-700 font-medium')}>
          {t('Tested')}
        </span>
      </div>
    );
  }
  return null;
};

TestPanelHeader.displayName = 'TestPanelHeader';
export { TestPanelHeader };
