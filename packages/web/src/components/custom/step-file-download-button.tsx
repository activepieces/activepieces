import { t } from 'i18next';
import { Eye, EyeOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function StepFileDownloadButton({ fileUrl }: { fileUrl: string }) {
  // `file://` URLs point at a sandbox path that no longer exists once the run
  // has finished, so the file can never be fetched — surface that as a disabled
  // button with an explanation instead of a broken download.
  const isExpired = fileUrl.includes('file://');

  // Rendered inline (`<span>`) rather than a block `<div>` because the friendly
  // output view drops this button inside `<span>`/`<td>` leaf cells, where a
  // `<div>` would be invalid DOM nesting. The wrapper (not the button) is the
  // tooltip trigger so hover still works while the button is disabled.
  const button = (
    <span className="inline-flex items-center gap-0">
      <Button
        variant="ghost"
        size="sm"
        disabled={isExpired}
        onClick={() => downloadStepFile({ fileUrl })}
        className="flex items-center gap-2 p-2 max-h-[20px] text-xs"
      >
        {isExpired ? (
          <EyeOff className="w-4 h-4" />
        ) : (
          <Eye className="w-4 h-4" />
        )}
        {t('Download File')}
      </Button>
    </span>
  );

  if (!isExpired) {
    return button;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right">
          {t('File is not available after execution.')}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function downloadStepFile({ fileUrl }: { fileUrl: string }) {
  const link = document.createElement('a');
  link.href = fileUrl;
  // The browser uses the server's `Content-Disposition` filename (real name +
  // extension) from the file route — no forced download name needed.
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
