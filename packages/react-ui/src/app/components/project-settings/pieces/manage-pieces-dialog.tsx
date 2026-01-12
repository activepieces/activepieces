import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Type } from '@sinclair/typebox';
import { t } from 'i18next';
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem } from '@/components/ui/form';
import { Label } from '@/components/ui/label';
import { projectCollectionUtils } from '@/hooks/project-collection';
import { PiecesFilterType } from '@activepieces/shared';

import { MultiSelectPieceProperty } from '../../../../components/custom/multi-select-piece-property';
import { piecesHooks } from '../../../../features/pieces/lib/pieces-hooks';
import { authenticationSession } from '../../../../lib/authentication-session';

type ManagePiecesDialogProps = {
  onSuccess: () => void;
};

export const ManagePiecesDialog = React.memo(
  ({ onSuccess }: ManagePiecesDialogProps) => {
    const [open, setOpen] = useState(false);
    const { pieces: visiblePieces, isLoading: isLoadingVisiblePieces } =
      piecesHooks.usePieces({ searchQuery: '', includeHidden: false });
    useEffect(() => {
      form.setValue(
        'pieces',
        (visiblePieces ?? []).map((p) => p.name),
      );
    }, [isLoadingVisiblePieces]);
    const form = useForm<{
      pieces: string[];
    }>({
      resolver: typeboxResolver(
        Type.Object({
          pieces: Type.Array(Type.String()),
        }),
      ),
      defaultValues: {
        pieces: (visiblePieces ?? []).map((p) => p.name),
      },
    });

    const { pieces: allPieces, isLoading: isLoadingAllPieces } =
      piecesHooks.usePieces({ searchQuery: '', includeHidden: true });

    return (
      <Dialog open={open} onOpenChange={(open) => setOpen(open)}>
        <DialogTrigger asChild>
          <Button variant="default" className="flex gap-2 items-center">
            {t('Manage Pieces')}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Manage Pieces')}</DialogTitle>
            <DialogDescription>
              {t(
                'Choose which pieces you want to be available for your current project users',
              )}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form className="flex flex-col gap-4 mb-4">
              <FormField
                name="pieces"
                render={({ field }) => (
                  <FormItem className="grid space-y-2">
                    <Label htmlFor="pieces">{t('Pieces')}</Label>
                    <MultiSelectPieceProperty
                      placeholder={t('Pieces')}
                      options={
                        allPieces?.map((piece) => ({
                          value: piece.name,
                          label: piece.displayName,
                        })) ?? []
                      }
                      loading={isLoadingAllPieces || isLoadingVisiblePieces}
                      onChange={(e) => {
                        field.onChange(e);
                      }}
                      initialValues={field.value}
                      showDeselect={field.value.length > 0}
                    ></MultiSelectPieceProperty>
                  </FormItem>
                )}
              />
            </form>
          </Form>
          <DialogFooter>
            <Button
              variant={'outline'}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                setOpen(false);
              }}
            >
              {t('Cancel')}
            </Button>
            <Button
              disabled={false}
              loading={false}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onSuccess();
                setOpen(false);
                form.handleSubmit(() => {
                  projectCollectionUtils.update(
                    authenticationSession.getProjectId()!,
                    {
                      plan: {
                        piecesFilterType: PiecesFilterType.ALLOWED,
                        pieces: form.getValues().pieces,
                      },
                    },
                  );
                })(e);
              }}
            >
              {t('Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  },
);
ManagePiecesDialog.displayName = 'ManagePiecesDialog';
