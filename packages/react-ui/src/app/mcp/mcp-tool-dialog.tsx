import { DialogTrigger } from '@radix-ui/react-dialog';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { CreateOrEditConnectionDialog } from '@/app/connections/create-edit-connection-dialog';
import { SearchableSelect } from '@/components/custom/searchable-select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { appConnectionsHooks } from '@/features/connections/lib/app-connections-hooks';
import { mcpHooks } from '@/features/mcp/lib/mcp-hooks';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import { StepMetadata } from '@/features/pieces/lib/types';
import {
  isNil,
  McpPieceWithConnection,
  ActionType,
  PackageType,
  PieceType
} from '@activepieces/shared';

import { mcpApi } from '../../features/mcp/lib/mcp-api';

type McpToolDialogProps = {
  children: React.ReactNode;
  mcpPieceToUpdate?: McpPieceWithConnection;
  mcpId: string;
  onSuccess?: () => void;
};

export const McpToolDialog = React.memo(
  ({ children, mcpPieceToUpdate, mcpId, onSuccess }: McpToolDialogProps) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('pieces');
    const [connectionDialogOpen, setConnectionDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPieceActions, setSelectedPieceActions] = useState<string[]>([]);
    const [allActionsSelected, setAllActionsSelected] = useState(false);
    const { toast } = useToast();
    
    const { data: mcp, refetch: refetchMcp } = mcpHooks.useMcp(mcpId);
    const { pieces, isLoading: piecesLoading } = piecesHooks.usePieces({});
    
    const form = useForm<{ 
      pieceName: string; 
      connectionId: string | null;
      pieceVersion: string;
    }>({
      defaultValues: {
        pieceName: '',
        connectionId: null,
        pieceVersion: '',
      },
    });

    // Initialize form and selected actions when editing a tool
    useEffect(() => {
      if (dialogOpen && mcpPieceToUpdate) {
        form.setValue('pieceName', mcpPieceToUpdate.pieceName);
        form.setValue('connectionId', mcpPieceToUpdate.connectionId || null);
        form.setValue('pieceVersion', mcpPieceToUpdate.pieceVersion || '');
        
        if (mcpPieceToUpdate.actionNames) {
          setSelectedPieceActions(mcpPieceToUpdate.actionNames);
        }
      }
    }, [dialogOpen, mcpPieceToUpdate, form]);

    const selectedPiece = pieces?.find(
      (piece) => piece.name === form.watch('pieceName')
    );
    
    // Create a StepMetadata object for the selected piece to use with usePieceActionsOrTriggers
    const stepMetadata: StepMetadata | undefined = useMemo(() => {
      if (!selectedPiece) return undefined;
      
      return {
        type: ActionType.PIECE,
        displayName: selectedPiece.displayName,
        logoUrl: selectedPiece.logoUrl,
        description: selectedPiece.description || '',
        pieceName: selectedPiece.name,
        pieceVersion: selectedPiece.version,
        categories: selectedPiece.categories || [],
        packageType: PackageType.REGISTRY,
        pieceType: PieceType.OFFICIAL,
        auth: selectedPiece.auth
      };
    }, [selectedPiece]);
    
    // Use the hook to fetch piece actions
    const { data: pieceActions, isLoading: actionsLoading } = piecesHooks.usePieceActionsOrTriggers({
      stepMetadata
    });
    
    // Update allActionsSelected when selectedPieceActions changes
    useEffect(() => {
      if (Array.isArray(pieceActions) && pieceActions.length > 0) {
        const allSelected = pieceActions.length === selectedPieceActions.length;
        setAllActionsSelected(allSelected);
      }
    }, [selectedPieceActions, pieceActions]);
    
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

    const filteredPieces = pieces?.filter((piece) => {
      return (
        piece.name !== '@activepieces/piece-mcp' &&
        piece.name !== '@activepieces/piece-webhook' &&
        piece.displayName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    const pieceHasAuth = !isNil(selectedPiece?.auth);
    const connectionOptions = connections?.map((connection) => ({
      label: connection.displayName,
      value: connection.id,
    })) ?? [];

    const connectionOptionsWithNewConnectionOption = [
      { label: t('+ New Connection'), value: '' },
      ...connectionOptions,
    ];

    const addOrUpdateMcpPieceMutation = useMutation({
      mutationFn: async ({
        mcpId,
        pieceName,
        pieceVersion,
        connectionId,
        actionNames,
      }: {
        mcpId: string;
        pieceName: string;
        pieceVersion: string;
        connectionId?: string;
        actionNames: string[];
      }) => {
        return mcpApi.updatePiece(
          mcpId,
          {
            pieceName,
            pieceVersion,
            connectionId,
            actionNames,
          }
        );
      },
      onSuccess: () => {
        toast({
          description: mcpPieceToUpdate
            ? t('Tool updated successfully')
            : t('Tool added successfully'),
          duration: 3000,
        });
        refetchMcp();
        setDialogOpen(false);
        if (onSuccess) {
          onSuccess();
        }
      },
      onError: (err) => {
        console.error(err);
        toast({
          variant: 'destructive',
          title: t('Error'),
          description: mcpPieceToUpdate
            ? t('Failed to update tool')
            : t('Failed to add tool'),
          duration: 5000,
        });
      },
    });

    const onSubmit = () => {
      if (mcp && selectedPiece) {
        const values = form.getValues();
        addOrUpdateMcpPieceMutation.mutate({
          mcpId: mcp.id,
          pieceName: values.pieceName,
          pieceVersion: values.pieceVersion || selectedPiece.version || '',
          connectionId: values.connectionId ?? undefined,
          actionNames: selectedPieceActions,
        });
      }
    };

    const clickPiece = (name: string) => {
      if (!name) {
        form.setValue('pieceName', '');
        setSelectedPieceActions([]);
        return;
      }
      
      form.setValue('pieceName', name);
      
      // Set the piece version
      const piece = pieces?.find(p => p.name === name);
      if (piece) {
        form.setValue('pieceVersion', piece.version);
      }
      
      // If the piece is already added, set the selected actions
      const existingPiece = mcp?.pieces.find(piece => piece.pieceName === name);
      if (existingPiece && existingPiece.actionNames && existingPiece.actionNames.length > 0) {
        setSelectedPieceActions(existingPiece.actionNames);
      } else {
        setSelectedPieceActions([]);
      }
    };

    const toggleAction = (actionName: string) => {
      setSelectedPieceActions(prev => {
        if (prev.includes(actionName)) {
          return prev.filter(a => a !== actionName);
        } else {
          return [...prev, actionName];
        }
      });
    };

    const toggleSelectAll = (checked: boolean) => {
      setAllActionsSelected(checked);
      if (checked && Array.isArray(pieceActions)) {
        const allActionNames = pieceActions.map((action) => action.name);
        setSelectedPieceActions(allActionNames);
      } else {
        setSelectedPieceActions([]);
      }
    };

    // Reset state when dialog closes
    const handleDialogOpenChange = (open: boolean) => {
      setDialogOpen(open);
      if (!open) {
        // Reset everything when closing
        resetForm();
      } else {
        // If we're opening without an editing piece, make sure the form is reset
        if (!mcpPieceToUpdate) {
          resetForm();
        }
      }
    };

    // Extract the reset logic to avoid repetition
    const resetForm = () => {
      form.reset({
        pieceName: '',
        connectionId: null,
        pieceVersion: '',
      });
      setSelectedPieceActions([]);
      setSearchTerm('');
      setActiveTab('pieces');
      setAllActionsSelected(false);
    };

    const renderPiecesTab = () => (
      <div className="space-y-4">
        {!selectedPiece ? (
          <>
            <div className="mb-4">
              <Input
                placeholder={t('Search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <ScrollArea className="flex-grow overflow-y-auto">
              <div className="grid grid-cols-4 gap-4">
                {(piecesLoading ||
                  (filteredPieces && filteredPieces.length === 0)) && (
                  <div className="text-center">{t('No pieces found')}</div>
                )}
                {!piecesLoading &&
                  filteredPieces &&
                  filteredPieces.map((piece, index) => (
                    <div
                      key={index}
                      onClick={() => clickPiece(piece.name)}
                      className="border p-2 h-[150px] w-[150px] flex flex-col items-center justify-center hover:bg-accent hover:text-accent-foreground cursor-pointer rounded-lg"
                    >
                      <img
                        className="w-[40px] h-[40px]"
                        src={piece.logoUrl}
                        alt={piece.displayName}
                      />
                      <div className="mt-2 text-center text-md">
                        {piece.displayName}
                      </div>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-2 p-2">
              {selectedPiece.logoUrl && (
                <img
                  src={selectedPiece.logoUrl}
                  alt={selectedPiece.displayName}
                  className="w-6 h-6"
                />
              )}
              <div>
                <h3 className="text-base font-medium">{selectedPiece.displayName}</h3>
                {selectedPiece.description && (
                  <p className="text-xs text-muted-foreground">{selectedPiece.description}</p>
                )}
              </div>
            </div>

        {/* Connection selector if needed */}
        {pieceHasAuth && (
          <div className="space-y-1.5">
            <Label className="text-sm">{t('Connection')}</Label>
            <SearchableSelect
              value={form.watch('connectionId') ?? undefined}
              onChange={(value) => {
                if (value) {
                  form.setValue('connectionId', value);
                } else {
                  setConnectionDialogOpen(true);
                }
              }}
              options={connectionOptionsWithNewConnectionOption}
              placeholder={t('Select a connection')}
              loading={connectionsLoading || isRefetchingConnections}
            />
          </div>
        )}

            <div className="space-y-2">
              <div className="flex items-center justify-between px-2">
                <Label className="text-sm font-medium">{t('Actions')}</Label>
                <div className="flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    id="select-all"
                    checked={allActionsSelected}
                    onCheckedChange={toggleSelectAll}
                  />
                  <label
                    htmlFor="select-all"
                    className="text-xs font-medium cursor-pointer"
                  >
                    {t('Select All')}
                  </label>
                </div>
              </div>
              
              <ScrollArea className="h-[350px] border rounded-md">
                {actionsLoading && (
                  <div className="text-center py-4 text-muted-foreground">
                    {t('Loading actions...')}
                  </div>
                )}
                {!actionsLoading && (!Array.isArray(pieceActions) || pieceActions.length === 0) ? (
                  <div className="text-center py-4 text-muted-foreground">
                    {t('No actions available for this piece')}
                  </div>
                ) : (
                  <div className="space-y-0">
                    {pieceActions?.map((action, index) => (
                      <div 
                        key={action.name}
                        className="hover:bg-accent/5 cursor-pointer border-b border-border/30 last:border-b-0"
                        onClick={() => toggleAction(action.name)}
                      >
                        <div className="flex items-start py-2.5">
                          <div className="mx-2 mt-0.5" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              id={action.name}
                              checked={selectedPieceActions.includes(action.name)}
                              onCheckedChange={() => toggleAction(action.name)}
                            />
                          </div>
                          <img
                            src={selectedPiece.logoUrl}
                            alt={selectedPiece.displayName}
                            className="w-4 h-4 mt-0.5 mr-2"
                          />
                          <div className="flex-1 pr-2">
                            <div className="text-sm font-medium">{action.displayName}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {action.description}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        )}
      </div>
    );

    const renderFlowsTab = () => (
      <div className="p-4 text-center text-muted-foreground">
        {t('Flow configuration will be implemented here')}
      </div>
    );

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
          />
        )}
        <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogTrigger asChild>{children}</DialogTrigger>
          <DialogContent className="min-w-[700px] max-w-[700px]">
            <DialogHeader>
              <DialogTitle>
                {mcpPieceToUpdate ? t('Edit Tool') : t('Add Tool')}
              </DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="pieces" value={activeTab} onValueChange={setActiveTab} className="mt-4">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="pieces">{t('Pieces')}</TabsTrigger>
                <TabsTrigger value="flows">{t('Flows')}</TabsTrigger>
              </TabsList>
              <TabsContent value="pieces" className="mt-0">
                {renderPiecesTab()}
              </TabsContent>
              <TabsContent value="flows" className="mt-0">
                {renderFlowsTab()}
              </TabsContent>
            </Tabs>

            {selectedPiece && (
              <DialogFooter className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.setValue('pieceName', '');
                    setSelectedPieceActions([]);
                  }}
                >
                  {t('Back')}
                </Button>
                <Button
                  onClick={onSubmit}
                  disabled={
                    selectedPieceActions.length === 0 ||
                    (pieceHasAuth && !form.watch('connectionId'))
                  }
                  loading={addOrUpdateMcpPieceMutation.isPending}
                >
                  {t('Confirm')}
                </Button>
              </DialogFooter>
            )}

            {!selectedPiece && (
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="ghost">
                    {t('Close')}
                  </Button>
                </DialogClose>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }
);

McpToolDialog.displayName = 'McpToolDialog';
export default McpToolDialog; 