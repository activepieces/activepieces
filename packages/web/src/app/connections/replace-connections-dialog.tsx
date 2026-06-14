import { AppConnectionScope, isNil, PopulatedFlow } from '@activepieces/shared';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { ChevronDown, GlobeIcon, Info, WorkflowIcon } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { FieldErrors, useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { SearchableSelect } from '@/components/custom/searchable-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormField, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  appConnectionsMutations,
  appConnectionsQueries,
} from '@/features/connections';
import { flowsApi } from '@/features/flows';
import { PieceIconWithPieceName, piecesHooks } from '@/features/pieces';

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

type VersionScope = 'draft' | 'published';
type OldConnectionAction = 'keep' | 'delete';

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
  const [versionScope, setVersionScope] = useState<VersionScope>('draft');
  const [oldConnectionAction, setOldConnectionAction] =
    useState<OldConnectionAction>('keep');
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
        toast.error(t('Error'), {
          description: t('Failed to get affected flows'),
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

  const publishedAffectedCount = affectedFlows.filter(
    (flow) => !isNil(flow.publishedVersionId),
  ).length;
  const applyToPublishedVersions = versionScope === 'published';
  const deleteBlockedByPublishedFlows =
    !applyToPublishedVersions && publishedAffectedCount > 0;
  const effectiveDeleteSourceConnection =
    oldConnectionAction === 'delete' && !deleteBlockedByPublishedFlows;

  const handleBack = () => {
    setStep(STEP.SELECT);
    setAffectedFlows([]);
    setVersionScope('draft');
    setOldConnectionAction('keep');
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
      deleteSourceConnection: effectiveDeleteSourceConnection,
      applyToPublishedVersions,
    });
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
    form.reset();
    setStep(STEP.SELECT);
    setAffectedFlows([]);
    setVersionScope('draft');
    setOldConnectionAction('keep');
  };
  const navigate = useNavigate();

  return (
    <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {step === STEP.SELECT
              ? t('Replace connection')
              : t('Review and confirm')}
          </DialogTitle>
          <DialogDescription>
            {step === STEP.SELECT
              ? t(
                  'Switch flows from one connection to another. Choose the connection to replace and the one to use instead.',
                )
              : t('Review what changes, then replace.')}
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
            {affectedFlows.length === 0 ? (
              <div className="flex items-center gap-2 rounded-md border border-dashed px-3 py-2.5 text-sm text-muted-foreground">
                <WorkflowIcon className="w-4 h-4 shrink-0" />
                {t('No flows use this connection yet')}
              </div>
            ) : (
              <Collapsible defaultOpen className="rounded-md border">
                <CollapsibleTrigger className="group flex w-full items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium">
                  <span>
                    {t('flowsUsingConnection', { count: affectedFlows.length })}
                  </span>
                  <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground transition-transform group-data-[state=closed]:-rotate-90" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <ScrollArea className="max-h-[140px] px-3 pb-3">
                    <div className="flex flex-wrap gap-1.5">
                      {affectedFlows.map((flow) => (
                        <Badge
                          key={flow.id}
                          variant="secondary"
                          className="max-w-[200px] cursor-pointer hover:bg-secondary/70"
                          onClick={() =>
                            navigate(
                              `/projects/${flow.projectId}/flows/${flow.id}`,
                            )
                          }
                        >
                          <WorkflowIcon className="w-3 h-3 shrink-0" />
                          <span className="truncate">
                            {flow.version.displayName}
                          </span>
                        </Badge>
                      ))}
                    </div>
                  </ScrollArea>
                </CollapsibleContent>
              </Collapsible>
            )}

            <div className="flex flex-col gap-1.5">
              <LabelWithTooltip
                label={t('Which versions to update')}
                tooltip={t(
                  'Draft only updates your working copy. Live flows keep using the old connection until you publish them again. Draft and published republishes affected flows now, which can interrupt running automations.',
                )}
              />
              <Select
                value={versionScope}
                onValueChange={(value) => {
                  const scope = value as VersionScope;
                  setVersionScope(scope);
                  if (scope === 'draft' && publishedAffectedCount > 0) {
                    setOldConnectionAction('keep');
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">{t('Draft only')}</SelectItem>
                  <SelectItem value="published">
                    {t('Draft and published')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <LabelWithTooltip
                label={t('After replacing')}
                tooltip={t(
                  'Keep the old connection to reuse it later, or delete it for good. Deleting is unavailable while published flows still use it — switch the option above to Draft and published first.',
                )}
              />
              <Select
                value={oldConnectionAction}
                onValueChange={(value) =>
                  setOldConnectionAction(value as OldConnectionAction)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="keep">
                    {t('Keep the old connection')}
                  </SelectItem>
                  <SelectItem
                    value="delete"
                    disabled={deleteBlockedByPublishedFlows}
                  >
                    {t('Delete the old connection')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <span className="text-xs text-muted-foreground">
              {t(
                'MCP servers are not updated automatically — reconnect them manually.',
              )}
            </span>

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

function LabelWithTooltip({
  label,
  tooltip,
}: {
  label: string;
  tooltip: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Label>{label}</Label>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">{tooltip}</TooltipContent>
      </Tooltip>
    </div>
  );
}

ReplaceConnectionsDialog.displayName = 'ReplaceConnectionsDialog';
export { ReplaceConnectionsDialog };
