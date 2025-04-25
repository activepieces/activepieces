import { DialogTrigger } from '@radix-ui/react-dialog';
import { t } from 'i18next';
import { Replace } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { FieldErrors, useForm } from 'react-hook-form';

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
import PieceIconWithPieceName from '@/features/pieces/components/piece-icon-from-name';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import {
  AppConnectionWithoutSensitiveData,
  PopulatedFlow,
} from '@activepieces/shared';

type ReplaceConnectionsDialogProps = {
  onConnectionMerged: () => void;
  children: React.ReactNode;
  connections: AppConnectionWithoutSensitiveData[];
  projectId: string;
};

type FormData = {
  pieceName: string;
  sourceConnections: string;
  replacedWithConnection: string;
};

const ReplaceConnectionsDialog = React.memo(
  ({
    onConnectionMerged,
    children,
    connections,
    projectId,
  }: ReplaceConnectionsDialogProps) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
    const [affectedFlows, setAffectedFlows] = useState<Array<PopulatedFlow>>(
      [],
    );
    const { toast } = useToast();
    const { pieces, isLoading: piecesLoading } = piecesHooks.usePieces({});

    const form = useForm<FormData>({
      defaultValues: {
        pieceName: '',
        sourceConnections: '',
        replacedWithConnection: '',
      },
      resolver: (values) => {
        const errors: FieldErrors<FormData> = {};

        if (!values.pieceName) {
          errors.pieceName = {
            type: 'required',
            message: t('Please select a piece'),
          };
        }

        if (values.pieceName && !values.sourceConnections) {
          errors.sourceConnections = {
            type: 'required',
            message: t('Please select a connection to replace'),
          };
        }

        if (values.sourceConnections && !values.replacedWithConnection) {
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

    // Get unique piece names from connections
    const connectionPieceNames = useMemo(
      () => new Set(connections.map((conn) => conn.pieceName)),
      [connections],
    );

    // Filter pieces to only those that have connections
    const piecesOptions = useMemo(
      () =>
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
          })) ?? [],
      [pieces, connectionPieceNames],
    );

    const filteredConnections = connections.filter(
      (conn) => conn.pieceName === selectedPiece,
    );

    const replacedWithOptions = filteredConnections
      .filter((conn) => conn.id !== form.watch('sourceConnections'))
      .map((conn) => ({
        label: conn.displayName,
        value: conn.id,
      }));

    const handleSubmit = async (values: FormData) => {
      try {
        const affected = await appConnectionsApi.flows(
          values.sourceConnections,
        );

        if (affected.length === 0) {
          await handleConfirmedSubmit(values);
          toast({
            title: t('Info'),
            description: t('No flows will be affected by this change'),
          });
          return;
        }

        setAffectedFlows(affected);
        setConfirmationDialogOpen(true);
      } catch (error) {
        toast({
          title: t('Error'),
          description: t('Failed to get affected flows'),
          variant: 'destructive',
        });
      }
    };

    const handleConfirmedSubmit = async (values: FormData) => {
      try {
        await appConnectionsApi.replace({
          sourceAppConnectionId: values.sourceConnections,
          targetAppConnectionId: values.replacedWithConnection,
          projectId: projectId,
        });
        toast({
          title: t('Success'),
          description: t('Connections replaced successfully'),
        });
        setDialogOpen(false);
        setConfirmationDialogOpen(false);
        onConnectionMerged();
      } catch (error) {
        toast({
          title: t('Error'),
          description: t('Failed to replace connections'),
          variant: 'destructive',
        });
      }
    };

    return (
      <>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              form.reset();
              setConfirmationDialogOpen(false);
            }
          }}
        >
          <DialogTrigger asChild>{children}</DialogTrigger>
          <DialogContent className="flex flex-col">
            <DialogHeader>
              <DialogTitle>{t('Replace Connections')}</DialogTitle>
              <DialogDescription>
                {t('Replace one connection with another.')}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
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
                          form.setValue('sourceConnections', '');
                          form.setValue('replacedWithConnection', '');
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
                            value={field.value}
                            onChange={(value) => {
                              field.onChange(value);
                              form.setValue('replacedWithConnection', '');
                            }}
                            options={filteredConnections.map((conn) => ({
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
                              value={field.value}
                              onChange={field.onChange}
                              options={replacedWithOptions}
                              placeholder={t(
                                'Choose connection to replace with',
                              )}
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
                    <Button type="button" variant="secondary">
                      {t('Cancel')}
                    </Button>
                  </DialogClose>
                  <Button type="submit">
                    <Replace className="h-4 w-4 mr-2" />
                    {t('Replace')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog
          open={confirmationDialogOpen}
          onOpenChange={setConfirmationDialogOpen}
        >
          <DialogContent className="flex flex-col">
            <DialogHeader>
              <DialogTitle>{t('Confirm Connection Replacement')}</DialogTitle>
              <DialogDescription>
                {t('After replacement, you will need to ')}{' '}
                <span className="font-bold text-black">{t('republish')}</span>{' '}
                {t(
                  ' the following flows that will be affected by this change.',
                )}
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="h-[275px]">
              <ul className="list-disc pl-6 gap-2">
                {affectedFlows.map((flow, index) => (
                  <li key={index}>{flow.version.displayName}</li>
                ))}
              </ul>
            </ScrollArea>

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setConfirmationDialogOpen(false)}
              >
                {t('Cancel')}
              </Button>
              <Button
                type="button"
                onClick={() => handleConfirmedSubmit(form.getValues())}
              >
                {t('Confirm')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  },
);

ReplaceConnectionsDialog.displayName = 'ReplaceConnectionsDialog';
export { ReplaceConnectionsDialog };
