import { isNil } from '@activepieces/core-utils';
import { formErrors, HEX_COLOR_PATTERN } from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useRef } from 'react';
import { FieldPath, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { platformApi } from '@/api/platforms-api';
import { FeatureBanner } from '@/app/components/feature-banner';
import { ColorPicker } from '@/components/custom/color-picker';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';

export const AppearanceSection = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const branding = flagsHooks.useWebsiteBranding();
  const brandingLocked = !platform.plan.customAppearanceEnabled;

  const form = useForm<PlatformAppearanceSchema>({
    defaultValues: {
      name: platform.name,
      color: platform.primaryColor,
      customThemeColors: !isNil(platform.themeColors),
      themeColors: {
        avatar: branding.colors.avatar,
        'blue-link': branding.colors['blue-link'],
        danger: branding.colors.danger,
        selection: branding.colors.selection,
        primary: {
          dark: branding.colors.primary.dark,
          light: branding.colors.primary.light,
          medium: branding.colors.primary.medium,
        },
        warn: {
          default: branding.colors.warn.default,
          light: branding.colors.warn.light,
          dark: branding.colors.warn.dark,
        },
        success: {
          default: branding.colors.success.default,
          light: branding.colors.success.light,
        },
      },
    },
    resolver: zodResolver(PlatformAppearanceSchema),
    mode: 'onChange',
  });

  const logoRef = useRef<HTMLInputElement>(null);
  const iconRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  const { mutate: updatePlatform, isPending } = useMutation({
    mutationFn: async () => {
      const logo = logoRef.current?.files?.[0];
      const icon = iconRef.current?.files?.[0];
      const favicon = faviconRef.current?.files?.[0];
      const { name, color, customThemeColors, themeColors } = form.getValues();

      const formdata = new FormData();
      formdata.append('name', name);
      if (!brandingLocked) {
        formdata.append('primaryColor', color);
        formdata.append(
          'themeColors',
          customThemeColors ? JSON.stringify(themeColors) : 'null',
        );
        if (logo) formdata.append('fullLogo', logo);
        if (icon) formdata.append('logoIcon', icon);
        if (favicon) formdata.append('favIcon', favicon);
      }

      await platformApi.updateWithFormData(formdata, platform.id);
      window.location.reload();
    },
    onSuccess: () => {
      toast.success(t('Your changes have been saved.'), { duration: 3000 });
      form.reset(form.getValues());
    },
  });

  return (
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

            {brandingLocked && (
              <FeatureBanner
                message={t(
                  'Your logo, colors and favicon are part of custom branding.',
                )}
              />
            )}

            <div className="grid space-y-2">
              <Label htmlFor="logoFile">{t('Logo')}</Label>
              <Input
                type="file"
                ref={logoRef}
                defaultFileName={platform.fullLogoUrl}
                accept="image/*"
                id="logoFile"
                disabled={brandingLocked}
                className="rounded-sm"
              />
            </div>
            <div className="grid space-y-2">
              <Label htmlFor="iconFile">{t('Icon')}</Label>
              <Input
                type="file"
                ref={iconRef}
                defaultFileName={platform.logoIconUrl}
                accept="image/*"
                id="iconFile"
                disabled={brandingLocked}
                className="rounded-sm"
              />
            </div>
            <div className="grid space-y-2">
              <Label htmlFor="faviconFile">{t('Favicon')}</Label>
              <Input
                type="file"
                ref={faviconRef}
                defaultFileName={platform.favIconUrl}
                accept="image/*"
                id="faviconFile"
                disabled={brandingLocked}
                className="rounded-sm"
              />
            </div>

            <FormField
              name="color"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <FormLabel htmlFor="color">{t('Primary Color')}</FormLabel>
                  <div className="flex flex-row gap-2 items-center">
                    <ColorPicker
                      disabled={brandingLocked}
                      value={field.value}
                      onChange={(color: string) => field.onChange(color)}
                      className="flex flex-row gap-2 items-center"
                    ></ColorPicker>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customThemeColors"
              render={({ field }) => (
                <FormItem className="grid space-y-2">
                  <FormLabel htmlFor="customThemeColors">
                    {t('Customize theme colors')}
                  </FormLabel>
                  <div className="flex flex-row gap-2 items-center">
                    <Switch
                      id="customThemeColors"
                      disabled={brandingLocked}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </div>
                  <FormDescription>
                    {t(
                      'When disabled, theme colors are derived from your primary color.',
                    )}
                  </FormDescription>
                </FormItem>
              )}
            />

            {form.watch('customThemeColors') && !brandingLocked && (
              <div className="grid grid-cols-3 gap-4">
                {THEME_COLOR_FIELDS.map(({ name, label }) => (
                  <FormField
                    key={name}
                    control={form.control}
                    name={name}
                    render={({ field }) => (
                      <FormItem className="grid space-y-2">
                        <FormLabel>{t(label)}</FormLabel>
                        <div className="flex flex-row gap-2 items-center">
                          <ColorPicker
                            value={field.value as string}
                            onChange={(color: string) => field.onChange(color)}
                            className="flex flex-row gap-2 items-center"
                          ></ColorPicker>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            )}
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
  );
};

const hexColor = z.string().regex(HEX_COLOR_PATTERN, 'invalidHexColor');

const ThemeColorsSchema = z.object({
  avatar: hexColor,
  'blue-link': hexColor,
  danger: hexColor,
  selection: hexColor,
  primary: z.object({
    dark: hexColor,
    light: hexColor,
    medium: hexColor,
  }),
  warn: z.object({
    default: hexColor,
    light: hexColor,
    dark: hexColor,
  }),
  success: z.object({
    default: hexColor,
    light: hexColor,
  }),
});

const PlatformAppearanceSchema = z.object({
  name: z.string().min(1, formErrors.required),
  color: z.string(),
  customThemeColors: z.boolean(),
  themeColors: ThemeColorsSchema,
});

const THEME_COLOR_FIELDS: {
  name: FieldPath<PlatformAppearanceSchema>;
  label: string;
}[] = [
  { name: 'themeColors.primary.dark', label: 'Primary Dark' },
  { name: 'themeColors.primary.light', label: 'Primary Light' },
  { name: 'themeColors.primary.medium', label: 'Primary Medium' },
  { name: 'themeColors.danger', label: 'Danger' },
  { name: 'themeColors.warn.default', label: 'Warning' },
  { name: 'themeColors.warn.light', label: 'Warning Light' },
  { name: 'themeColors.warn.dark', label: 'Warning Dark' },
  { name: 'themeColors.success.default', label: 'Success' },
  { name: 'themeColors.success.light', label: 'Success Light' },
  { name: 'themeColors.blue-link', label: 'Link' },
  { name: 'themeColors.avatar', label: 'Avatar' },
  { name: 'themeColors.selection', label: 'Selection' },
];

type PlatformAppearanceSchema = z.infer<typeof PlatformAppearanceSchema>;
