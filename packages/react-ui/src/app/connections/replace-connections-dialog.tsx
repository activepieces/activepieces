import { DialogTrigger } from '@radix-ui/react-dialog';
import { useMutation, useQuery } from '@tanstack/react-query';
import { t } from 'i18next';
import { GlobeIcon } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { FieldErrors, useForm, useWatch } from 'react-hook-form';

import { SearchableSelect } from '@/components/custom/searchable-select';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { appConnectionsApi } from '@/features/connections/lib/app-connections-api';
import { flowsApi } from '@/features/flows/lib/flows-api';
import PieceIconWithPieceName from '@/features/pieces/components/piece-icon-from-name';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import { cn } from '@/lib/utils';
import { AppConnectionScope, PopulatedFlow } from '@activepieces/shared';

import { ConnectionFlowCard } from './connection-flow-card';

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

  const { data: connections, isLoading: connectionsLoading } = useQuery({
    queryKey: ['appConnections', projectId, dialogOpen],
    queryFn: () => {
      return appConnectionsApi.list({
        projectId,
        cursor: undefined,
        limit: 1000,
      });
    },
    enabled: dialogOpen,
  });

  const { mutate: replaceConnections, isPending: isReplacing } = useMutation({
    mutationFn: async (values: FormData) => {
      await appConnectionsApi.replace({
        sourceAppConnectionId: values.sourceConnections.id,
        targetAppConnectionId: values.replacedWithConnection.id,
        projectId: projectId,
      });
    },
    onSuccess: () => {
      toast({
        title: t('Success'),
        description: t('Connections replaced successfully'),
      });
      setDialogOpen(false);
      onConnectionMerged();
    },
    onError: () => {
      toast({
        title: t('Error'),
        description: t('Failed to replace connections'),
        variant: 'destructive',
      });
    },
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

    replaceConnections(values);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    form.reset();
    setStep(STEP.SELECT);
    setAffectedFlows([]);
  };

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
              t('Replace one connection with another.')
            ) : (
              <>
                {t('This action requires ')}
                <span className="font-bold text-black">
                  {t('republishing')}
                </span>
                {t(' affected flows and ')}
                <span className="font-bold text-black">
                  {t('reconnecting')}
                </span>
                {t(' any associated MCP pieces.')}
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
                        <Label>{t('Connection to Replace')}</Label>
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

                  <Alert>
                    <AlertDescription>
                      {t(
                        'All flows will be changed to use the replaced with connection',
                      )}
                    </AlertDescription>
                  </Alert>
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
                  affectedFlows.map((flow, index) => (
                    <ConnectionFlowCard key={index} flow={flow} />
                  ))
                )}
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={handleBack}>
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
