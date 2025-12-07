import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ColorPicker } from '@/components/ui/color-picker';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/ui/spinner';
import { platformHooks } from '@/hooks/platform-hooks';
import { API_URL } from '@/lib/api';
import { fileApi } from '@/lib/file-api';
import { platformApi } from '@/lib/platforms-api';
import { FileType, UploadFileRequestBody } from '@activepieces/shared';

const FromSchema = Type.Object({
  name: Type.String(),
  logoUrl: Type.String(),
  iconUrl: Type.String(),
  faviconUrl: Type.String(),
  color: Type.String(),
});

type FromSchema = Static<typeof FromSchema>;

const ASSETS_URL = `${API_URL}/v1/files`;

export const AppearanceSection = () => {
  const { platform } = platformHooks.useCurrentPlatform();

  const form = useForm({
    defaultValues: {
      name: platform?.name,
      logoUrl: platform?.fullLogoUrl,
      iconUrl: platform?.logoIconUrl,
      faviconUrl: platform?.favIconUrl,
      color: platform?.primaryColor,
    },
    resolver: typeboxResolver(FromSchema),
  });

  const typeMap: Partial<Record<FileType, keyof FromSchema>> = {
    [FileType.PLATFORM_LOGO]: 'logoUrl',
    [FileType.PLATFORM_ICON]: 'iconUrl',
    [FileType.PLATFORM_FAVICON]: 'faviconUrl',
  };

  const { mutate: uploadFile } = useMutation({
    mutationFn: (params: UploadFileRequestBody) => {
      const formData = new FormData();
      formData.append('fileType', params.fileType);
      formData.append('file', params.file as Blob);
      return fileApi.uploadFile(formData);
    },
  });
  const [isUploading, setIsUploading] = useState<string[]>([]);

  const handleFileChange = (
    fileType: FileType,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsUploading((prev) => [...prev, fileType]);
      uploadFile(
        {
          fileType,
          file: file,
        },
        {
          onSuccess: (data) => {
            form.setValue(
              typeMap[fileType] as keyof FromSchema,
              `${ASSETS_URL}/${data.id}`,
              { shouldValidate: true },
            );
            setIsUploading((prev) => prev.filter((type) => type !== fileType));
          },
          onError: (error) => {
            toast.error(error.message ?? t('Failed to upload file'));
            setIsUploading((prev) => prev.filter((type) => type !== fileType));
          },
        },
      );
    }
  };

  const { mutate: updatePlatform, isPending } = useMutation({
    mutationFn: async () => {
      platformApi.update(
        {
          name: form.getValues().name,
          fullLogoUrl: form.getValues().logoUrl,
          logoIconUrl: form.getValues().iconUrl,
          favIconUrl: form.getValues().faviconUrl,
          primaryColor: form.getValues().color,
        },
        platform.id,
      );
      window.location.reload();
    },
    onSuccess: () => {
      toast.success(t('Your changes have been saved.'), {
        duration: 3000,
      });
      form.reset(form.getValues());
    },
  });

  return (
    <>
      <Separator className="my-2" />
      <div className="text-lg font-bold">{t('Appearance')}</div>

      <div className="grid gap-4">
        <Form {...form}>
          <form
            className="grid space-y-4 mt-4"
            onSubmit={form.handleSubmit(() => updatePlatform())}
          >
            <div className="max-w-[600px] grid space-y-4">
              <FormField
                name="name"
                render={({ field }) => (
                  <FormItem className="grid space-y-2">
                    <FormLabel htmlFor="name">{t('Platform Name')}</FormLabel>
                    <Input
                      {...field}
                      required
                      id="name"
                      placeholder={t('Platform Name')}
                      className="rounded-sm"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="logoUrl"
                render={() => (
                  <FormItem className="grid space-y-2">
                    <FormLabel htmlFor="logoFile">{t('Logo')}</FormLabel>
                    <div className="flex flex-row gap-2 items-center">
                      <Input
                        type="file"
                        defaultFileName={platform?.fullLogoUrl}
                        accept="image/*"
                        id="logoFile"
                        onChange={(e) =>
                          handleFileChange(FileType.PLATFORM_LOGO, e)
                        }
                        className="rounded-sm"
                      />
                      {isUploading.includes(FileType.PLATFORM_LOGO) && (
                        <LoadingSpinner />
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="iconUrl"
                render={() => (
                  <FormItem className="grid space-y-2">
                    <FormLabel htmlFor="iconFile">{t('Icon')}</FormLabel>
                    <div className="flex flex-row gap-2 items-center">
                      <Input
                        type="file"
                        defaultFileName={platform?.logoIconUrl}
                        accept="image/*"
                        id="iconFile"
                        onChange={(e) =>
                          handleFileChange(FileType.PLATFORM_ICON, e)
                        }
                        className="rounded-sm"
                      />
                      {isUploading.includes(FileType.PLATFORM_ICON) && (
                        <LoadingSpinner />
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="faviconUrl"
                render={() => (
                  <FormItem className="grid space-y-2">
                    <FormLabel htmlFor="faviconUrl">
                      {t('Favicon URL')}
                    </FormLabel>
                    <div className="flex flex-row gap-2 items-center">
                      <Input
                        type="file"
                        defaultFileName={platform?.favIconUrl}
                        accept="image/*"
                        id="faviconFile"
                        onChange={(e) =>
                          handleFileChange(FileType.PLATFORM_FAVICON, e)
                        }
                        className="rounded-sm"
                      />
                      {isUploading.includes(FileType.PLATFORM_FAVICON) && (
                        <LoadingSpinner />
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="color"
                render={({ field }) => (
                  <FormItem className="grid space-y-2">
                    <FormLabel htmlFor="color">{t('Primary Color')}</FormLabel>
                    <div className="flex flex-row gap-2 items-center">
                      <ColorPicker
                        value={field.value as string}
                        onChange={(color) => field.onChange(color)}
                        className="flex flex-row gap-2 items-center"
                      ></ColorPicker>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            </div>

            {form?.formState?.errors?.root?.serverError && (
              <FormMessage>
                {form.formState.errors.root.serverError.message}
              </FormMessage>
            )}
            <div className="flex gap-2 justify-end mt-4">
              <Button
                type="submit"
                loading={isPending}
                disabled={!form.formState.isValid}
              >
                {t('Save')}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </>
  );
};
