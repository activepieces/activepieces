
import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { HttpStatusCode } from 'axios';
import { t } from 'i18next';
import { Plus } from 'lucide-react';
import pako from 'pako';
import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

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
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
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
import {
  AddPieceRequestBody,
  ApFlagId,
  PackageType,
  PieceScope,
} from '@activepieces/shared';

import { piecesApi } from '../lib/pieces-api';

const FormSchema = Type.Object(
  {
    packageType: Type.Enum(PackageType),
    pieceName: Type.Optional(Type.String()),
    scope: Type.Enum(PieceScope),
    pieceVersion: Type.Optional(Type.String()),
    pieceArchive: Type.Optional(Type.Any()),
  },
  {
    errorMessage: {
      required: t('Please select a package type'),
    },
  },
);

type InstallPieceDialogProps = {
  onInstallPiece: () => void;
  scope: PieceScope;
};
const InstallPieceDialog = ({
  onInstallPiece,
  scope,
}: InstallPieceDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const { data: privatePiecesEnabled } = flagsHooks.useFlag<boolean>(
    ApFlagId.PRIVATE_PIECES_ENABLED,
  );

  const form = useForm<Static<typeof FormSchema>>({
    resolver: typeboxResolver(FormSchema),
    defaultValues: {
      scope,
      packageType: PackageType.REGISTRY,
    },
  });

  const handleArchiveUpload = async (file: File) => {
    if (file && file.name.endsWith('.tgz')) {
      try {
        const fileBuffer = await file.arrayBuffer();
        const decompressedData = pako.ungzip(new Uint8Array(fileBuffer));
        const text = new TextDecoder().decode(decompressedData);

        // Look for package.json content in the decompressed data
        const packageJsonMatch = text.match(
          /package\.json.*?{[^}]*"name"\s*:\s*"([^"]+)".*?"version"\s*:\s*"([^"]+)"/s,
        );
        if (packageJsonMatch) {
          form.setValue('pieceName', packageJsonMatch[1]);
          form.setValue('pieceVersion', packageJsonMatch[2]);
        } else {
          form.setError('pieceArchive', {
            message: t('package.json not found in archive'),
          });
        }
      } catch (error) {
        console.error('Error processing file:', error);
        form.setError('pieceArchive', {
          message: t('Error processing archive file'),
        });
      }
    } else {
      form.setError('pieceArchive', {
        message: t('Please upload a .tgz file'),
      });
    }
  };

  const { mutate, isPending } = useMutation<void, Error, AddPieceRequestBody>({
    mutationFn: async (data) => {
      form.clearErrors();

      if (data.packageType === PackageType.REGISTRY) {
        if (!data.pieceName) {
          form.setError('pieceName', {
            message: t('Piece name is required for NPM Registry'),
          });
        }
        if (!data.pieceVersion) {
          form.setError('pieceVersion', {
            message: t('Piece version is required for NPM Registry'),
          });
        }
        if (!data.pieceName || !data.pieceVersion) {
          return;
        }
      }

      await piecesApi.install(data);
    },
    onSuccess: () => {
      setIsOpen(false);
      form.reset();
      onInstallPiece();
      toast({
        title: t('Success'),
        description: t('Piece installed'),
        duration: 3000,
      });
    },
    onError: (error) => {
      if (api.isError(error)) {
        switch (error.response?.status) {
          case HttpStatusCode.Conflict:
            form.setError('root.serverError', {
              message: t('Piece already installed.'),
            });
            break;
          default:
            form.setError('root.serverError', {
              message: t('Something went wrong, please try again later'),
            });
            break;
        }
      }
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => setIsOpen(open)}>
      <DialogTrigger asChild>
        <Button size="sm" className="flex items-center justify-center gap-2">
          <Plus className="size-4" />
          {t('Install Piece')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('Install a piece')}</DialogTitle>
          <DialogDescription>
            <ApMarkdown
              markdown={
                'Use this to install a [custom piece]("https://www.activepieces.com/docs/developers/building-pieces/create-action") that you (or someone else) created. Once the piece is installed, you can use it in the flow builder.\n\nWarning: Make sure you trust the author as the piece will have access to your flow data and it might not be compatible with the current version of Activepieces.'
              }
            />
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form
            className="flex flex-col gap-4"
            onSubmit={form.handleSubmit((data) =>
              mutate(data as AddPieceRequestBody),
            )}
          >
            <FormField
              name="packageType"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="packageType">
                    {t('Package Type')}
                  </FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      if (value === PackageType.ARCHIVE) {
                        form.setValue('pieceName', undefined);
                        form.setValue('pieceVersion', undefined);
                      }
                      form.clearErrors();
                    }}
                    defaultValue={PackageType.REGISTRY}
                  >
                    <SelectTrigger>
                      <SelectValue defaultValue={PackageType.REGISTRY} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value={PackageType.REGISTRY}>
                          {t('NPM Registry')}
                        </SelectItem>
                        {privatePiecesEnabled && (
                          <SelectItem value={PackageType.ARCHIVE}>
                            {t('Packed Archive (.tgz)')}
                          </SelectItem>
                        )}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch('packageType') === PackageType.REGISTRY && (
              <>
                <FormField
                  name="pieceName"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="pieceName">
                        {t('Piece Name')}
                      </FormLabel>
                      <Input
                        {...field}
                        value={field.value || ''}
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
                      <FormLabel htmlFor="pieceVersion">
                        {t('Piece Version')}
                      </FormLabel>
                      <Input
                        {...field}
                        value={field.value || ''}
                        id="pieceVersion"
                        type="text"
                        placeholder="0.0.1"
                        className="rounded-sm"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {form.watch('packageType') === PackageType.ARCHIVE && (
              <FormField
                name="pieceArchive"
                control={form.control}
                render={({ field: { value, onChange, ...fieldProps } }) => (
                  <FormItem>
                    <FormLabel htmlFor="pieceArchive">
                      {t('Package Archive')}
                    </FormLabel>
                    <Input
                      {...fieldProps}
                      id="pieceArchive"
                      type="file"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          onChange(file);
                          handleArchiveUpload(file);
                        }
                      }}
                      placeholder={t('Package archive')}
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
              {t('Install')}
            </Button>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
};

export { InstallPieceDialog };
