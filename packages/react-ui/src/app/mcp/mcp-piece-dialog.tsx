import { DialogTrigger } from '@radix-ui/react-dialog';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import React, { useState } from 'react';
import { FieldErrors, useForm } from 'react-hook-form';

import { CreateOrEditConnectionDialog } from '@/app/connections/create-edit-connection-dialog';
import { SearchableSelect } from '@/components/custom/searchable-select';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormField, FormMessage } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { appConnectionsHooks } from '@/features/connections/lib/app-connections-hooks';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import {
  isNil,
  McpPieceStatus,
  McpPieceWithConnection,
} from '@activepieces/shared';

import { mcpApi } from '../../features/mcp/lib/mcp-api';
import { mcpHooks } from '../../features/mcp/lib/mcp-hooks';

type McpPieceDialogProps = {
  children: React.ReactNode;
  mcpPieceToUpdate?: McpPieceWithConnection;
};

export const McpPieceDialog = React.memo(
  ({ children, mcpPieceToUpdate }: McpPieceDialogProps) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
    const { data: mcp, refetch: refetchMcp } = mcpHooks.useMcp();
    const addOrUpdateMcpPieceMutation = useMutation({
      mutationFn: async ({
        mcpId,
        pieceName,
        connectionId,
      }: {
        mcpId: string;
        pieceName: string;
        connectionId?: string;
      }) => {
        if (mcpPieceToUpdate) {
          return mcpApi.updatePiece({
            pieceId: mcpPieceToUpdate.id,
            connectionId,
            status: mcpPieceToUpdate.status,
          });
        }
        return mcpApi.addPiece({
          mcpId,
          pieceName,
          connectionId,
          status: McpPieceStatus.ENABLED,
        });
      },
      onSuccess: () => {
        toast({
          description: mcpPieceToUpdate
            ? t('Piece is updated successfully')
            : t('Piece is added successfully'),
          duration: 3000,
        });
        refetchMcp();
        setDialogOpen(false);
      },
      onError: (err) => {
        console.error(err);
        toast({
          variant: 'destructive',
          title: t('Error'),
          description: mcpPieceToUpdate
            ? t('Failed to update piece')
            : t('Failed to add piece'),
          duration: 5000,
        });
      },
    });
    const { pieces, isLoading: piecesLoading } = piecesHooks.usePieces({});
    const piecesOptions =
      pieces
        ?.filter(
          (piece) =>
            piece.name !== '@activepieces/piece-mcp' &&
            piece.name !== '@activepieces/piece-webhook',
        )
        .map((piece) => ({
          label: piece.displayName,
          value: piece.name,
        })) ?? [];

    const form = useForm<{ pieceName: string; connectionId: string | null }>({
      defaultValues: {
        pieceName: mcpPieceToUpdate?.pieceName ?? '',
        connectionId: mcpPieceToUpdate?.connectionId ?? null,
      },
      resolver: (values) => {
        const errors: FieldErrors<{
          pieceName: string;
          connectionId: string | null;
          status: McpPieceStatus;
        }> = {};
        if (!values.pieceName) {
          errors.pieceName = {
            message: t('Please select a piece'),
            type: 'required',
          };
        }
        if (values.pieceName) {
          const piece = pieces?.find(
            (piece) => piece.name === values.pieceName,
          );
          if (piece && pieceHasAuth && !values.connectionId) {
            errors.connectionId = {
              message: t('Please select a connection'),
              type: 'required',
            };
          }
        }

        if (
          mcp?.pieces.find((piece) => piece.pieceName === values.pieceName) &&
          isNil(mcpPieceToUpdate)
        ) {
          errors.pieceName = {
            message: t('Your MCP server already has this piece'),
            type: 'required',
          };
        }
        return {
          values: Object.keys(errors).length === 0 ? values : {},
          errors,
        };
      },
    });
    const selectedPiece = pieces?.find(
      (piece) => piece.name === form.watch('pieceName'),
    );
    const {
      data: connections,
      isLoading: connectionsLoading,
      refetch: refetchConnections,
      isRefetching: isRefetchingConnections,
    } = appConnectionsHooks.useConnections({
      pieceName: selectedPiece?.name || '',
      cursor: undefined,
      limit: 1000,
    });

    const pieceHasAuth = !isNil(selectedPiece?.auth);
    const connectionOptions =
      connections?.map((connection) => ({
        label: connection.displayName,
        value: connection.id,
      })) ?? [];

    const connectionOptionsWithNewConnectionOption = [
      { label: t('+ New Connection'), value: '' },
      ...connectionOptions,
    ];

    const onSubmit = (values: {
      pieceName: string;
      connectionId: string | null;
    }) => {
      if (mcp) {
        addOrUpdateMcpPieceMutation.mutate({
          mcpId: mcp.id,
          pieceName: values.pieceName,
          connectionId: values.connectionId ?? undefined,
        });
      }
    };

    return (
      <>
        {selectedPiece && pieceHasAuth && (
          <CreateOrEditConnectionDialog
            piece={selectedPiece}
            open={connectionDialogOpen}
            setOpen={(open, connection) => {
              setConnectionDialogOpen(open);
              if (connection) {
                form.setValue('connectionId', connection.id);
                refetchConnections();
              }
            }}
            reconnectConnection={null}
            isGlobalConnection={false}
          ></CreateOrEditConnectionDialog>
        )}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>{children}</DialogTrigger>
          <DialogContent className="flex flex-col ">
            <DialogHeader>
              <DialogTitle>
                {mcpPieceToUpdate
                  ? `${t('Edit Piece')} (${
                      pieces?.find(
                        (piece) => piece.name === mcpPieceToUpdate.pieceName,
                      )?.displayName
                    })`
                  : t('Add Piece')}
              </DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <div className="flex flex-col gap-4">
                  {isNil(mcpPieceToUpdate) && (
                    <FormField
                      control={form.control}
                      name="pieceName"
                      render={({ field }) => {
                        return (
                          <>
                            <Label>{t('Piece')}</Label>
                            <SearchableSelect
                              value={field.value}
                              onChange={(value) => {
                                field.onChange(value);
                              }}
                              options={piecesOptions}
                              placeholder={t('Select a piece')}
                              loading={piecesLoading}
                              valuesRendering={(value) => {
                                const piece = pieces?.find(
                                  (piece) => piece.name === value,
                                );
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
                            ></SearchableSelect>
                            <FormMessage />
                          </>
                        );
                      }}
                    ></FormField>
                  )}

                  {selectedPiece && pieceHasAuth && (
                    <FormField
                      control={form.control}
                      name="connectionId"
                      render={({ field }) => {
                        return (
                          <>
                            <Label>{t('Connection')}</Label>
                            <SearchableSelect
                              value={field.value ?? undefined}
                              onChange={(value) => {
                                if (value) {
                                  field.onChange(value);
                                } else {
                                  setConnectionDialogOpen(true);
                                }
                              }}
                              options={connectionOptionsWithNewConnectionOption}
                              placeholder={t('Select a connection')}
                              loading={
                                connectionsLoading || isRefetchingConnections
                              }
                            ></SearchableSelect>
                            <FormMessage />
                          </>
                        );
                      }}
                    ></FormField>
                  )}
                </div>

                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      {t('Cancel')}
                    </Button>
                  </DialogClose>
                  <Button
                    type="submit"
                    variant="default"
                    loading={addOrUpdateMcpPieceMutation.isPending}
                  >
                    {t('Confirm')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </>
    );
  },
);

McpPieceDialog.displayName = 'McpPieceDialog';
