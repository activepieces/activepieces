import { t } from 'i18next';
import { useState } from 'react';

import ActivepiecesCreateTodoGuide from '@/assets/img/custom/ActivepiecesCreateTodoGuide.png';
import ActivepiecesTodo from '@/assets/img/custom/ActivepiecesTodo.png';
import ExternalChannelTodo from '@/assets/img/custom/External_Channel_Todo.png';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  HandleSelectCallback,
  PieceSelectorItem,
  StepMetadata,
} from '@/features/pieces/lib/types';
import { TODO_TYPE } from '@activepieces/shared';

type CreateTodoGuideProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  handleSelect: HandleSelectCallback;
  actionOrTriggers: PieceSelectorItem[];
  selectedPieceMetadata: StepMetadata;
};

const CreateTodoGuide = ({
  open,
  setOpen,
  handleSelect,
  actionOrTriggers,
  selectedPieceMetadata,
}: CreateTodoGuideProps) => {
  const [integrationType, setIntegrationType] = useState<TODO_TYPE>(
    TODO_TYPE.INTERNAL,
  );
  const [hoveredOption, setHoveredOption] = useState<TODO_TYPE | null>(null);
  const displayImageType = hoveredOption || integrationType;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-xl">
            {t('Create Todo Guide')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1">
          {/* Horizontal split layout */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left side - Options */}
            <div className="md:w-1/2 space-y-6">
              <h3 className="text-lg font-medium">
                {t('Choose your flow type:')}
              </h3>

              {/* Option cards */}
              <div className="space-y-4">
                {/* Activepieces Todos option */}
                <div
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    integrationType === TODO_TYPE.INTERNAL
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                  onClick={() => setIntegrationType(TODO_TYPE.INTERNAL)}
                  onMouseEnter={() => setHoveredOption(TODO_TYPE.INTERNAL)}
                  onMouseLeave={() => setHoveredOption(null)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-md font-medium flex items-center gap-2">
                      {t('Activepieces Todos')}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border text-xs cursor-help">
                              i
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="w-[550px]">
                            <div className="space-y-2">
                              <p className="text-sm">
                                {t(
                                  'Users will manage tasks directly in Activepieces',
                                )}
                              </p>
                              <div className="bg-muted rounded p-1">
                                <img
                                  src={ActivepiecesTodo}
                                  alt="Activepieces Todo UI"
                                  className="w-full h-auto rounded"
                                />
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </h4>
                    <div className="flex-shrink-0 w-5 h-5">
                      <div
                        className={`w-5 h-5 rounded-full grid place-items-center border ${
                          integrationType === TODO_TYPE.INTERNAL
                            ? 'border-primary'
                            : 'border-muted-foreground'
                        }`}
                      >
                        {integrationType === TODO_TYPE.INTERNAL && (
                          <div className="w-3 h-3 rounded-full bg-primary"></div>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t(
                      'Users will manage and respond to todos directly within the Activepieces interface. Ideal for internal teams.',
                    )}
                  </p>
                </div>

                {/* External Channel option */}
                <div
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    integrationType === TODO_TYPE.EXTERNAL
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                  onClick={() => setIntegrationType(TODO_TYPE.EXTERNAL)}
                  onMouseEnter={() => setHoveredOption(TODO_TYPE.EXTERNAL)}
                  onMouseLeave={() => setHoveredOption(null)}
                >
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-md font-medium">
                      {t('External Channel (Slack, Teams, Email, ...)')}
                    </h4>
                    <div className="flex-shrink-0 w-5 h-5">
                      <div
                        className={`w-5 h-5 rounded-full grid place-items-center border ${
                          integrationType === TODO_TYPE.EXTERNAL
                            ? 'border-primary'
                            : 'border-muted-foreground'
                        }`}
                      >
                        {integrationType === TODO_TYPE.EXTERNAL && (
                          <div className="w-3 h-3 rounded-full bg-primary"></div>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t(
                      'Send notifications with approval links via external channels like Slack, Teams or Email. Best for collaborating with external stakeholders.',
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Right side - Dynamic image with reduced height */}
            <div className="md:w-1/2 flex flex-col items-center justify-center">
              <div className="border rounded-lg overflow-hidden p-3 w-full h-full">
                <div className="flex flex-col items-center h-[480px]">
                  <h3 className="text-md font-medium mb-3 text-center">
                    {t('Preview')}
                  </h3>

                  {/* Fixed height image container with gradient overlay */}
                  <div className="w-full h-[350px] overflow-hidden rounded mb-2 flex items-center justify-center bg-muted/50 relative">
                    <img
                      src={
                        displayImageType === TODO_TYPE.INTERNAL
                          ? ActivepiecesCreateTodoGuide
                          : ExternalChannelTodo
                      }
                      alt={
                        displayImageType === TODO_TYPE.INTERNAL
                          ? 'Activepieces Todos flow'
                          : 'External channel flow'
                      }
                      className="w-full h-full object-contain"
                    />
                    {/* Gradient overlay at the bottom - increased height */}
                    <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-white dark:from-background to-transparent"></div>
                  </div>

                  {/* Image description with reduced bottom margin */}
                  <p className="text-sm text-muted-foreground italic text-center mb-2">
                    {displayImageType === TODO_TYPE.INTERNAL
                      ? t(
                          'The Activepieces Todo allows users to review and approve tasks directly in the Activepieces interface',
                        )
                      : t(
                          'You can add the channel before the Wait Step, and configure the logic in the Router step',
                        )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 mt-3 pt-3 border-t">
          <Button
            variant="secondary"
            onClick={() => setOpen(false)}
            className="mr-2"
          >
            {t('Cancel')}
          </Button>
          <Button
            onClick={() => {
              switch (integrationType) {
                case TODO_TYPE.INTERNAL: {
                  const selectedItem = actionOrTriggers.find(
                    (item) => item.name === 'createTodoAndWait',
                  );
                  if (selectedItem) {
                    handleSelect(
                      selectedPieceMetadata,
                      selectedItem,
                      integrationType,
                    );
                  }
                  break;
                }
                case TODO_TYPE.EXTERNAL: {
                  const selectedItem = actionOrTriggers.find(
                    (item) => item.name === 'createTodo',
                  );
                  if (selectedItem) {
                    handleSelect(
                      selectedPieceMetadata,
                      selectedItem,
                      integrationType,
                    );
                  }
                  break;
                }
              }
              setOpen(false);
            }}
          >
            {t('Add Steps')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

CreateTodoGuide.displayName = 'CreateTodoGuide';
export { CreateTodoGuide };
