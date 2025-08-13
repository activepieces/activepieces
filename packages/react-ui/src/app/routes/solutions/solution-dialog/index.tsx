import { GearIcon } from '@radix-ui/react-icons';
import { t } from 'i18next';
import { ArrowLeft, Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { ApMarkdown } from '@/components/custom/markdown';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ImportSolutionResponse, MarkdownVariant } from '@activepieces/shared';

import { solutionsHooks } from '../../../../features/solutions/lib/solutions-hooks';
import { solutions } from '../solutions';

import { ConfigureScreen } from './configure-screen';
import { SolutionOverview } from './solution-overview';
import { SuccessScreen } from './success-screen';

interface SolutionDialogProps {
  solution: (typeof solutions)[0];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Screen = 'overview' | 'configure' | 'success';

export type SolutionConnectionFormData = {
  [key: string]: string | null;
};

const SolutionDialog = ({
  solution,
  open,
  onOpenChange,
}: SolutionDialogProps) => {
  const [screen, setScreen] = useState<Screen>('overview');
  const [importedAssets, setImportedAssets] =
    useState<ImportSolutionResponse | null>(null);
  const connections = solution.state.connections ?? [];

  const initialFormData: SolutionConnectionFormData = connections.reduce(
    (acc, connection) => {
      acc[connection.externalId] = null;
      return acc;
    },
    {} as SolutionConnectionFormData,
  );

  const form = useForm<SolutionConnectionFormData>({
    defaultValues: initialFormData,
  });

  const { mutate: importSolution, isPending: isImporting } =
    solutionsHooks.useImportSolution((response) => {
      setImportedAssets(response);
      setScreen('success');
    });

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleConfigure = () => {
    setScreen('configure');
  };

  const handleBackToOverview = () => {
    setScreen('overview');
  };

  const validateConnections = () => {
    const errors: Record<string, any> = {};
    let hasErrors = false;

    connections.forEach((connection) => {
      const value = form.getValues(connection.externalId);
      if (!value) {
        errors[connection.externalId] = {
          type: 'required',
          message: t('Please select a connection'),
        };
        hasErrors = true;
      }
    });

    if (hasErrors) {
      Object.keys(errors).forEach((fieldName) => {
        form.setError(fieldName as any, errors[fieldName]);
      });
    }

    return !hasErrors;
  };

  const handleClone = () => {
    const isValid = validateConnections();
    if (isValid) {
      const formData = form.getValues();

      const connectionsMap: Record<string, string> = {};
      connections.forEach((connection) => {
        const selectedConnectionId = formData[connection.externalId];
        if (selectedConnectionId) {
          connectionsMap[connection.externalId] = selectedConnectionId;
        }
      });

      importSolution({
        solution,
        connectionsMap,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 p-4  mb-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 min-h-[40px]">
              {screen === 'configure' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={
                    screen === 'configure' ? handleBackToOverview : handleClose
                  }
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              )}
              <DialogTitle>{t('Import Solution')}</DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="flex flex-1 min-h-0 h-full">
            {/* Left side - 2/3 width for content */}
            <div className="flex-1 w-2/3 flex flex-col min-h-0">
              <ScrollArea className="flex-1">
                {screen === 'overview' && (
                  <div className="p-6 pt-0">
                    <ApMarkdown
                      markdown={solution.description}
                      variant={MarkdownVariant.BORDERLESS}
                      className="prose prose-sm max-w-none"
                    />
                  </div>
                )}
                {screen === 'success' && <SuccessScreen />}
                {screen === 'configure' && (
                  <Form {...form}>
                    <ConfigureScreen solution={solution} />
                  </Form>
                )}
              </ScrollArea>
            </div>

            {screen === 'success' && (
              <SolutionOverview
                solution={solution}
                onAction={handleClose}
                actionLabel={'Close'}
                importResponse={importedAssets}
                actionIcon={<Check className="h-4 w-4" />}
                isLoading={isImporting}
              />
            )}
            {screen === 'configure' && (
              <SolutionOverview
                solution={solution}
                onAction={handleClone}
                actionLabel={'Clone'}
                importResponse={importedAssets}
                actionIcon={<Copy className="h-4 w-4" />}
                isLoading={isImporting}
              />
            )}
            {screen === 'overview' && (
              <SolutionOverview
                solution={solution}
                onAction={handleConfigure}
                actionLabel={'Setup'}
                actionIcon={<GearIcon className="h-4 w-4" />}
                isLoading={isImporting}
                importResponse={importedAssets}
              />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export { SolutionDialog };
