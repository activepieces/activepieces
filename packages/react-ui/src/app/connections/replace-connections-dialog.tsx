import { DialogTrigger } from '@radix-ui/react-dialog';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { GlobeIcon, WorkflowIcon } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { FieldErrors, useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { SearchableSelect } from '@/components/custom/searchable-select';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Form, FormField, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import {
  appConnectionsMutations,
  appConnectionsQueries,
} from '@/features/connections/lib/app-connections-hooks';
import { flowsApi } from '@/features/flows/lib/flows-api';
import PieceIconWithPieceName from '@/features/pieces/components/piece-icon-from-name';
import { piecesHooks } from '@/features/pieces/lib/pieces-hooks';
import { cn } from '@/lib/utils';
import { AppConnectionScope, PopulatedFlow } from '@activepieces/shared';

type ReplaceConnectionsDialogProps = {
  onConnectionMerged: () => void;
  children: React.ReactNode;
  projectId: string;
};

type FormData = {
  pieceName: string;
  sourceConnections: { id: string; externalId: string };
  replacedWithConnection: { id: string; externalId: string };
};

enum STEP {
  SELECT = 'SELECT',
  CONFIRM = 'CONFIRM',
}

const ReplaceConnectionsDialog = ({
  onConnectionMerged,
  children,
  projectId,
}: ReplaceConnectionsDialogProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [step, setStep] = useState<STEP>(STEP.SELECT);
  const [affectedFlows, setAffectedFlows] = useState<Array<PopulatedFlow>>([]);
  const { toast } = useToast();
  const { pieces, isLoading: piecesLoading } = piecesHooks.usePieces({});

  const { data: connections, isLoading: connectionsLoading } =
    appConnectionsQueries.useAppConnections({
      request: {
        projectId,
        limit: 1000,
      },
      extraKeys: [projectId, dialogOpen],
      enabled: dialogOpen,
    });

  const { mutate: replaceConnections, isPending: isReplacing } =
    appConnectionsMutations.useReplaceConnections({
      setDialogOpen,
      refetch: onConnectionMerged,
    });

  const { mutate: fetchAffectedFlows, isPending: isFetchingAffectedFlows } =
    useMutation({
      mutationFn: async (externalId: string) => {
        const response = await flowsApi.list({
          projectId: projectId,
          connectionExternalIds: [externalId],
          cursor: undefined,
          limit: 1000,
        });
        return response;
      },
      onSuccess: (data) => {
        setAffectedFlows(data.data);
        setStep(STEP.CONFIRM);
      },
      onError: () => {
        toast({
          title: t('Error'),
          description: t('Failed to get affected flows'),
          variant: 'destructive',
        });
      },
    });

  const form = useForm<FormData>({
    defaultValues: {
      pieceName: '',
      sourceConnections: { id: '', externalId: '' },
      replacedWithConnection: { id: '', externalId: '' },
    },
    mode: 'onSubmit',
    resolver: (values) => {
      const errors: FieldErrors<FormData> = {};

      if (!values.pieceName) {
        errors.pieceName = {
          type: 'required',
          message: t('Please select a piece'),
        };
      }

      if (!values.sourceConnections?.id) {
        errors.sourceConnections = {
          type: 'required',
          message: t('Please select a connection to replace'),
        };
      }

      if (!values.replacedWithConnection?.id) {
        errors.replacedWithConnection = {
          type: 'required',
          message: t('Please select a connection to replace with'),
        };
      }

      return {
        values: Object.keys(errors).length === 0 ? values : {},
        errors,
      };
    },
  });

  const selectedPiece = form.watch('pieceName');

  const connectionPieceNames = new Set(
    connections?.data.map((conn) => conn.pieceName),
  );

  const piecesOptions =
    pieces
      ?.filter(
        (piece) =>
          piece.name !== '@activepieces/piece-mcp' &&
          piece.name !== '@activepieces/piece-webhook' &&
          connectionPieceNames.has(piece.name),
      )
      .map((piece) => ({
        label: piece.displayName,
        value: piece.name,
      })) ?? [];

  const filteredConnections =
    connections?.data.filter((conn) => conn.pieceName === selectedPiece) ?? [];

  const sourceConnectionId = useWatch({
    control: form.control,
    name: 'sourceConnections.id',
  });

  const replacedWithOptions = useMemo(() => {
    return filteredConnections
      .filter((conn) => conn.id !== sourceConnectionId)
      .map((conn) => ({
        label: conn.displayName,
        value: conn.id,
      }));
  }, [filteredConnections, sourceConnectionId]);

  const handleBack = () => {
    setStep(STEP.SELECT);
    setAffectedFlows([]);
  };

  const handleConfirmedSubmit = async (values: FormData) => {
    const isValid = await form.trigger();
    if (!isValid) {
      form.trigger([
        'pieceName',
        'sourceConnections',
        'replacedWithConnection',
      ]);
      return;
    }

    replaceConnections({
      sourceAppConnectionId: values.sourceConnections.id,
      targetAppConnectionId: values.replacedWithConnection.id,
      projectId: projectId,
    });
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    form.reset();
    setStep(STEP.SELECT);
    setAffectedFlows([]);
  };
  const navigate = useNavigate();

  return (
    <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {step === STEP.SELECT
              ? t('Replace Connections')
              : t('Confirm Replacement')}
          </DialogTitle>
          <DialogDescription>
            {step === STEP.SELECT ? (
              t(
                'This will replace one connection with another connection, existing flows will be changed to use the new connection, and the old connection will be deleted.',
              )
            ) : (
              <>
                {t(
                  'Existing MCP servers will not be changed automatically, you have to reconnect them manually.',
                )}
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {step === STEP.SELECT ? (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((data) =>
                fetchAffectedFlows(data.sourceConnections.externalId),
              )}
              className="flex flex-col gap-4"
            >
              <FormField
                control={form.control}
                name="pieceName"
                render={({ field }) => (
                  <div className="flex flex-col gap-2">
                    <Label>{t('Piece')}</Label>
                    <SearchableSelect
                      value={field.value}
                      onChange={(value) => {
                        field.onChange(value);
                        form.setValue('sourceConnections', {
                          id: '',
                          externalId: '',
                        });
                        form.setValue('replacedWithConnection', {
                          id: '',
                          externalId: '',
                        });
                      }}
                      options={piecesOptions}
                      placeholder={t('Select a piece')}
                      loading={piecesLoading}
                      valuesRendering={(value) => {
                        const piece = pieces?.find((p) => p.name === value);
                        return (
                          <div className="flex gap-2 items-center">
                            <img
                              src={piece!.logoUrl}
                              alt={piece!.displayName}
                              className="w-4 h-4 object-contain"
                            />
                            <span>{piece!.displayName}</span>
                          </div>
                        );
                      }}
                    />
                    <FormMessage />
                  </div>
                )}
              />

              {selectedPiece && (
                <>
                  <FormField
                    control={form.control}
                    name="sourceConnections"
                    render={({ field }) => (
                      <div className="flex flex-col gap-2">
                        <Label>{t('Connection to replace')}</Label>
                        <SearchableSelect
                          value={field.value?.id}
                          loading={connectionsLoading}
                          onChange={(value) => {
                            const selectedConnection = filteredConnections.find(
                              (c) => c.id === value,
                            );
                            field.onChange({
                              id: selectedConnection?.id || '',
                              externalId: selectedConnection?.externalId || '',
                            });
                            form.setValue('replacedWithConnection', {
                              id: '',
                              externalId: '',
                            });
                          }}
                          options={filteredConnections
                            .filter(
                              (conn) =>
                                conn.scope === AppConnectionScope.PROJECT,
                            )
                            .map((conn) => ({
                              label: conn.displayName,
                              value: conn.id,
                            }))}
                          placeholder={t('Choose connection to replace')}
                          valuesRendering={(value) => {
                            const conn = filteredConnections.find(
                              (c) => c.id === value,
                            );
                            return (
                              <div className="flex gap-2 items-center">
                                <PieceIconWithPieceName
                                  pieceName={conn!.pieceName}
                                  size="xs"
                                  border={false}
                                  circle={false}
                                />
                                <span>{conn!.displayName}</span>
                              </div>
                            );
                          }}
                        />
                        <FormMessage />
                      </div>
                    )}
                  />

                  {selectedPiece && (
                    <FormField
                      control={form.control}
                      name="replacedWithConnection"
                      render={({ field }) => (
                        <div className="flex flex-col gap-2">
                          <Label>{t('Replaced With')}</Label>
                          <SearchableSelect
                            value={field.value?.id}
                            loading={connectionsLoading}
                            onChange={(value) => {
                              const selectedConnection =
                                filteredConnections.find((c) => c.id === value);
                              field.onChange({
                                id: selectedConnection?.id || '',
                                externalId:
                                  selectedConnection?.externalId || '',
                              });
                            }}
                            options={replacedWithOptions}
                            placeholder={t('Choose connection to replace with')}
                            valuesRendering={(value) => {
                              const conn = filteredConnections.find(
                                (c) => c.id === value,
                              );
                              return (
                                <div className="flex gap-2 items-center">
                                  <PieceIconWithPieceName
                                    pieceName={conn!.pieceName}
                                    size="xs"
                                    border={false}
                                    circle={false}
                                  />
                                  {conn?.scope ===
                                    AppConnectionScope.PLATFORM && (
                                    <GlobeIcon className="w-4 h-4" />
                                  )}
                                  <span>{conn!.displayName}</span>
                                </div>
                              );
                            }}
                          />
                          <FormMessage />
                        </div>
                      )}
                    />
                  )}
                </>
              )}

              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="ghost">
                    {t('Cancel')}
                  </Button>
                </DialogClose>
                <Button type="submit" loading={isFetchingAffectedFlows}>
                  {t('Next')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <div className="flex flex-col gap-4">
            <ScrollArea
              className={cn(
                'h-[275px]',
                affectedFlows.length === 0 && 'h-[80px]',
              )}
            >
              <div className="flex flex-col gap-2">
                {affectedFlows.length === 0 ? (
                  <span className="text-center text-muted-foreground p-4">
                    {t('No flows will be affected by this change')}
                  </span>
                ) : (
                  affectedFlows.map((flow) => (
                    <div
                      className="flex items-center justify-between"
                      key={flow.id}
                    >
                      <div className="flex items-center gap-2">
                        <WorkflowIcon className="w-5 h-5" />
                        <Button
                          variant="link"
                          className="p-0 h-auto font-medium text-foreground truncate text-base"
                          onClick={() => {
                            navigate(
                              `/projects/${flow.projectId}/flows/${flow.id}`,
                            );
                          }}
                        >
                          {flow.version.displayName}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button type="button" variant="accent" onClick={handleBack}>
                {t('Back')}
              </Button>
              <Button
                type="button"
                onClick={() => handleConfirmedSubmit(form.getValues())}
                loading={isReplacing}
              >
                {t('Replace')}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

ReplaceConnectionsDialog.displayName = 'ReplaceConnectionsDialog';
export { ReplaceConnectionsDialog };
