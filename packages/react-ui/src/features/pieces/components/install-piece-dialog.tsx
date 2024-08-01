import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { HttpStatusCode } from 'axios';
import { Plus } from 'lucide-react';
import { FormProvider, SubmitHandler, useForm } from 'react-hook-form';

import { ApMarkdown } from '@/components/custom/markdown';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { flagsHooks } from '@/hooks/flags-hooks';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { ApFlagId, PackageType, PieceScope } from '@activepieces/shared';

import { piecesApi } from '../lib/pieces-api';
import { useState } from 'react';

const FormSchema = Type.Object({
  pieceName: Type.String({
    errorMessage: 'Please enter a piece name',
  }),
  pieceVersion: Type.String({
    errorMessage: 'Please enter a piece version',
  }),
  packageType: Type.Enum(PackageType, {
    errorMessage: 'Please select a package type',
  }),
  pieceArchive: Type.Union([
    Type.Any({
      errorMessage: 'Please upload a piece archive',
    }),
    Type.Null(),
  ]),
});

type FormSchema = Static<typeof FormSchema>;

type InstallPieceDialogProps = {
  onInstallPiece: () => void;
};
const InstallPieceDialog = ({ onInstallPiece }: InstallPieceDialogProps) => {

  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: privatePiecesEnabled } = flagsHooks.useFlag<boolean>(
    ApFlagId.PRIVATE_PIECES_ENABLED,
    queryClient,
  );

  const form = useForm<FormSchema>({
    resolver: typeboxResolver(FormSchema),
    defaultValues: {
      pieceArchive: null,
      packageType: PackageType.REGISTRY,
    },
  });

  const { mutate, isPending } = useMutation<
    void,
    Error,
    {
      pieceName: string;
      pieceVersion: string;
      packageType: string;
      pieceArchive: any | null;
    }
  >({
    mutationFn: async (data) => {
      const formData = new FormData();
      formData.set('packageType', data.packageType);
      formData.set('pieceName', data.pieceName);
      formData.set('pieceVersion', data.pieceVersion);
      formData.set('scope', PieceScope.PROJECT);
      formData.set('projectId', authenticationSession.getProjectId());
      const pieceArchive = data.pieceArchive;
      if (pieceArchive) {
        formData.set('pieceArchive', pieceArchive);
      }
      await piecesApi.installCommunityPiece(formData);
    },
    onSuccess: () => {
      setIsOpen(false);
      onInstallPiece();
      toast({
        title: 'Success',
        description: 'Piece installed',
        duration: 3000,
      });
    },
    onError: (error) => {
      if (api.isError(error)) {
        switch (error.response?.status) {
          case HttpStatusCode.Conflict:
            form.setError('root.serverError', {
              message: 'Piece already installed.',
            });
            break;
          default:
            form.setError('root.serverError', {
              message: 'Something went wrong, please try again later',
            });
            break;
        }
      }
    },
  });

  const onSubmit: SubmitHandler<{
    pieceName: string;
    pieceVersion: string;
    packageType: string;
    pieceArchive: any | null;
  }> = (data) => {
    form.setError('root.serverError', {
      message: undefined,
    });
    mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="size-4" />
          Install Piece
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Install a piece</DialogTitle>
          <DialogDescription>
            <ApMarkdown
              markdown={`Use this to install a [custom piece]("https://www.activepieces.com/docs/developers/building-pieces/create-action") that you (or someone else) created. Once the piece is installed, you can use it in the flow builder.\n\nWarning: Make sure you trust the author as the piece will have access to your flow data and it might not be compatible with the current version of Activepieces.`}
            />
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              name="pieceName"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="pieceName">Piece Name</Label>
                  <Input
                    {...field}
                    required
                    id="pieceName"
                    type="text"
                    placeholder="@activepieces/piece-name"
                    className="rounded-sm"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="pieceVersion"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="pieceVersion">Piece Version</Label>
                  <Input
                    {...field}
                    required
                    id="pieceVersion"
                    type="text"
                    placeholder="0.0.1"
                    className="rounded-sm"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="packageType"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="packageType">Package Type</Label>
                  <Select
                    value={field.value}
                    onValueChange={(value) => field.onChange(value)}
                    defaultValue={PackageType.REGISTRY}
                  >
                    <SelectTrigger>
                      <SelectValue defaultValue={PackageType.REGISTRY} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value={PackageType.REGISTRY}>
                          NPM Registry
                        </SelectItem>
                        {privatePiecesEnabled && (
                          <SelectItem value={PackageType.ARCHIVE}>
                            Packed Archive (.tgz)
                          </SelectItem>
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.watch('packageType') === PackageType.ARCHIVE && (
              <FormField
                name="pieceArchive"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="pieceArchive">Package Archive</Label>
                    <Input
                      {...field}
                      id="pieceArchive"
                      type="file"
                      placeholder="Package archive"
                      className="rounded-sm"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {form?.formState?.errors?.root?.serverError && (
              <FormMessage>
                {form.formState.errors.root.serverError.message}
              </FormMessage>
            )}
            <Button loading={isPending} type="submit">
              Install
            </Button>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};

export { InstallPieceDialog };
