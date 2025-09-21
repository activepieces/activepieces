import { Coins, Wand } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { FlowOperationType } from '@activepieces/shared';
import { t } from 'i18next';
import { projectHooks } from '@/hooks/project-hooks';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useToast } from '@/components/ui/use-toast';

const FlowContextWidget = () => {
  const { flowVersion, applyOperation } = useBuilderStateContext((state) => ({
    flowVersion: state.flowVersion,
    applyOperation: state.applyOperation,
  }));
  const [open, setOpen] = useState(flowVersion.flowContext === '');
  const [context, setContext] = useState(flowVersion.flowContext ?? '');
  const { project } = projectHooks.useCurrentProject();
  const aiCreditsRemaining = (project?.plan?.aiCredits ?? 0) - (project?.usage?.aiCredits ?? 0);
  const [aiAutoFillEnabled, setAiAutoFillEnabled] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    applyOperation({
      type: FlowOperationType.UPDATE_FLOW_CONTEXT,
      request: {
        flowContext: context,
      },
    });
    toast({
      title: t('Flow context saved'),
      duration: 1000,
    });
    setOpen(false);
  };

  return (
    <div className="absolute top-0">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 h-8 px-3 text-slate-600"
          >
            <span className="text-xs">{t('AI Auto-Fill Settings')}</span>
            <Wand className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="center"
          side="bottom"
          className="w-[430px] p-4"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="space-y-5 flex flex-col items-center">
            <div className='flex items-center gap-2 justify-between w-full'>
              <div className='flex items-center gap-2'>
                <Switch checked={aiAutoFillEnabled} onCheckedChange={setAiAutoFillEnabled} size='sm' />
                <span className="font-medium text-xs">{t('Use AI to auto-fill fields')}</span>
              </div>
              <div className='text-sm flex items-center gap-2 text-slate-500'>
                <Coins className='w-4 h-4' />
                <span>{aiCreditsRemaining < 0 ? t('Unlimited') : aiCreditsRemaining + ' ' + t('credits left')}</span>
              </div>
            </div>
            <div className='flex flex-col gap-2 w-full items-center'>
              <span className="font-medium text-sm">{t('Describe your project to get better AI results')}</span>
              <Textarea
                placeholder={t('E.g., When I post an email and name in the leads channel, I want to find the lead’s company name, their position, company size and save them in the leads spreadsheet.')}
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="min-h-[100px] resize-none text-sm"
                autoFocus
              />
            </div>
            <div className='w-full flex justify-end gap-2'>
              <Button 
                variant="ghost" 
                className='text-slate-500'
              >
                {t('I’ll do it later')}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleSave}
                className='text-white hover:!text-white transition-all duration-200 hover:opacity-90'
                style={{
                  background: 'radial-gradient(47.57% 136.11% at 2.91% 6.94%, #9B5CFD 0%, #5305CC 100%)'
                }}
              >
                {t('Save')}
              </Button>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export { FlowContextWidget };
