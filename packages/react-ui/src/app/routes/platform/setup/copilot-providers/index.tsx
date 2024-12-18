import { t } from 'i18next';
import { CheckCircle2, Pencil, Trash } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TableTitle } from '@/components/ui/table-title';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { platformHooks } from '@/hooks/platform-hooks';
import { isNil } from '@activepieces/shared';

const CopilotSettingsPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const isCopilotconfigured = !isNil(platform?.copilotSettings);

  return (
    <div className="flex flex-col w-full">
      <div className="mb-4 flex flex-col gap-2">
        <TableTitle>{t('Copilot')}</TableTitle>
        <div className="text-md text-muted-foreground">
          {t(
            'Configure provider credentials for the Copilot feature, enabling users to generate code and more with AI assistance during flow creation.',
          )}
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <Card className="w-full px-4 py-4">
          <div className="flex w-full gap-2 justify-center items-center">
            <div className="flex flex-col gap-2 text-center mr-2">
              <img
                src={'https://cdn.activepieces.com/pieces/openai.png'}
                alt={'OpenAI'}
                width={32}
                height={32}
              />
            </div>
            <div className="flex flex-grow flex-col">
              <div className="text-lg">{t('OpenAI')}</div>
            </div>
            <div className="flex flex-row justify-center items-center gap-1">
              <Button
                variant={isCopilotconfigured ? 'ghost' : 'basic'}
                size={'sm'}
              >
                {isCopilotconfigured ? (
                  <Pencil className="size-4" />
                ) : (
                  t('Configure')
                )}
              </Button>
              {isCopilotconfigured && (
                <div className="gap-2 flex">
                  <Button variant={'ghost'} size={'sm'}>
                    <Trash className="size-4 text-destructive" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

CopilotSettingsPage.displayName = 'CopilotSettingsPage';
export { CopilotSettingsPage };
