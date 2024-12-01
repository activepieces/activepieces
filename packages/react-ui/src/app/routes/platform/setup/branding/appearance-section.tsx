import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Static, Type } from '@sinclair/typebox';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useForm } from 'react-hook-form';

import { LocalesEnum } from '@/app/routes/settings/appearance/language-switcher';
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { INTERNAL_ERROR_TOAST, useToast } from '@/components/ui/use-toast';
import { platformHooks } from '@/hooks/platform-hooks';
import { platformApi } from '@/lib/platforms-api';
import { localesMap } from '@/lib/utils';

const FromSchema = Type.Object({
  name: Type.String(),
  logoUrl: Type.String(),
  iconUrl: Type.String(),
  faviconUrl: Type.String(),
  language: Type.String(),
  color: Type.String(),
});

type FromSchema = Static<typeof FromSchema>;

export const AppearanceSection = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const locales = Object.entries(localesMap);
  const form = useForm({
    defaultValues: {
      name: platform?.name,
      logoUrl: platform?.fullLogoUrl,
      iconUrl: platform?.logoIconUrl,
      faviconUrl: platform?.favIconUrl,
      language: platform?.defaultLocale ?? LocalesEnum.ENGLISH,
      color: platform?.primaryColor,
    },
    resolver: typeboxResolver(FromSchema),
  });

  const { toast } = useToast();

  const { mutate: updatePlatform, isPending } = useMutation({
    mutationFn: async () => {
      platformApi.update(
        {
          name: form.getValues().name,
          fullLogoUrl: form.getValues().logoUrl,
          logoIconUrl: form.getValues().iconUrl,
          favIconUrl: form.getValues().faviconUrl,
          defaultLocale: form.getValues().language,
          primaryColor: form.getValues().color,
        },
        platform.id,
      );
      window.location.reload();
    },
    onSuccess: () => {
      toast({
        title: t('Success'),
        description: t('Your changes have been saved.'),
        duration: 3000,
      });
      form.reset(form.getValues());
    },
    onError: () => {
      toast(INTERNAL_ERROR_TOAST);
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
                    <FormLabel htmlFor="name">{t('Project Name')}</FormLabel>
                    <Input
                      {...field}
                      required
                      id="name"
                      placeholder={t('Project Name')}
                      className="rounded-sm"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="logoUrl"
                render={({ field }) => (
                  <FormItem className="grid space-y-2">
                    <FormLabel htmlFor="logoUrl">{t('Logo URL')}</FormLabel>
                    <Input
                      {...field}
                      required
                      id="logoUrl"
                      placeholder="https://www.example.com/logo.png"
                      className="rounded-sm"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="iconUrl"
                render={({ field }) => (
                  <FormItem className="grid space-y-2">
                    <FormLabel htmlFor="iconUrl">{t('Icon URL')}</FormLabel>
                    <Input
                      {...field}
                      required
                      id="iconUrl"
                      placeholder="https://www.example.com/icon.png"
                      className="rounded-sm"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="faviconUrl"
                render={({ field }) => (
                  <FormItem className="grid space-y-2">
                    <FormLabel htmlFor="faviconUrl">
                      {t('Favicon URL')}
                    </FormLabel>
                    <Input
                      {...field}
                      required
                      id="faviconUrl"
                      placeholder="https://www.example.com/favicon.png"
                      className="rounded-sm"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="language"
                render={({ field }) => (
                  <FormItem className="grid space-y-2">
                    <FormLabel htmlFor="language">
                      {t('Default Language')}
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('Select Language')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {locales.length === 0 && (
                            <SelectItem value="NULL">
                              {t('No Languages')}
                            </SelectItem>
                          )}
                          {locales.map(([locale, name]) => (
                            <SelectItem key={locale} value={locale}>
                              {name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
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
