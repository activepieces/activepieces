import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useRef } from 'react';
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
import { platformHooks } from '@/hooks/platform-hooks';
import { platformApi } from '@/lib/platforms-api';

const FromSchema = Type.Object({
  name: Type.String(),
  logoUrl: Type.String(),
  iconUrl: Type.String(),
  faviconUrl: Type.String(),
  color: Type.String(),
});

type FromSchema = Static<typeof FromSchema>;

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
  const logoRef = useRef<HTMLInputElement>(null);
  const iconRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  const { mutate: updatePlatform, isPending } = useMutation({
    mutationFn: async () => {
      const logo = logoRef.current?.files?.[0];
      const icon = iconRef.current?.files?.[0];
      const favicon = faviconRef.current?.files?.[0];

      const formdata = new FormData();
      formdata.append('name', form.getValues().name);
      formdata.append('primaryColor', form.getValues().color);
      if (logo) formdata.append('fullLogo', logo);
      if (icon) formdata.append('logoIcon', icon);
      if (favicon) formdata.append('favIcon', favicon);

      await platformApi.updateWithFormData(formdata, platform.id);
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
                        ref={logoRef}
                        defaultFileName={platform?.fullLogoUrl}
                        accept="image/*"
                        id="logoFile"
                        className="rounded-sm"
                      />
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
                        ref={iconRef}
                        defaultFileName={platform?.logoIconUrl}
                        accept="image/*"
                        id="iconFile"
                        className="rounded-sm"
                      />
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
                        ref={faviconRef}
                        defaultFileName={platform?.favIconUrl}
                        accept="image/*"
                        id="faviconFile"
                        className="rounded-sm"
                      />
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
