import { isNil } from '@activepieces/core-utils';
import { formErrors, HEX_COLOR_PATTERN } from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { t } from 'i18next';
import { useEffect, useRef } from 'react';
import { FieldPath, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { platformApi } from '@/api/platforms-api';
import { FeatureBanner } from '@/app/components/feature-banner';
import { ColorPicker } from '@/components/custom/color-picker';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemTitle,
} from '@/components/ui/item';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { brandSeed } from '@/lib/brand-seed';

import { BrandColorContrast, BrandColorPreview } from './brand-color-preview';

export const AppearanceSection = () => {
  const { platform } = platformHooks.useCurrentPlatform();
  const branding = flagsHooks.useWebsiteBranding();
  const brandingLocked = !platform.plan.customAppearanceEnabled;
  const initialColor = HEX_COLOR_PATTERN.test(platform.primaryColor)
    ? platform.primaryColor
    : branding.colors.primary.default;

  const form = useForm<PlatformAppearanceSchema>({
    defaultValues: {
      name: platform.name,
      color: initialColor,
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
    resolver: zodResolver(
      brandingLocked
        ? PlatformAppearanceSchema.extend({ color: z.string() })
        : PlatformAppearanceSchema,
    ),
    mode: 'onChange',
  });

  const previewColor = form.watch('color');
  const savedColor = branding.colors.primary.default;

  useEffect(() => {
    if (brandingLocked || !HEX_COLOR_PATTERN.test(previewColor)) {
      return;
    }
    brandSeed.apply({ primaryColor: previewColor });
  }, [previewColor, brandingLocked]);

  useEffect(
    () => () => brandSeed.apply({ primaryColor: savedColor }),
    [savedColor],
  );

  const logoRef = useRef<HTMLInputElement>(null);
  const iconRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  const { mutate: updatePlatform, isPending } = useMutation({
    mutationFn: async () => {
      form.clearErrors('root.serverError');
      const logo = logoRef.current?.files?.[0];
      const icon = iconRef.current?.files?.[0];
      const favicon = faviconRef.current?.files?.[0];
      const { name, color, customThemeColors, themeColors } = form.getValues();

      const formdata = new FormData();
      formdata.append('name', name);
      if (!brandingLocked) {
        if (color !== initialColor) {
          formdata.append('primaryColor', color);
        }
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
    onError: () => {
      form.setError('root.serverError', {
        type: 'manual',
        message: t('Failed to save changes. Please try again.'),
      });
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
                <FormItem className="space-y-0">
                  <Item variant="outline">
                    <ColorPicker
                      side="top"
                      disabled={brandingLocked}
                      value={field.value}
                      onChange={(color: string) => field.onChange(color)}
                      className="shrink-0"
                    />
                    <ItemContent>
                      <ItemTitle>
                        <FormLabel htmlFor="color">
                          {t('Primary Color')}
                        </FormLabel>
                      </ItemTitle>
                      <ItemDescription className="font-mono text-xs uppercase">
                        {field.value}
                      </ItemDescription>
                      <FormMessage />
                    </ItemContent>
                    <ItemActions>
                      <BrandColorContrast color={field.value} />
                    </ItemActions>
                    {HEX_COLOR_PATTERN.test(field.value) && (
                      <ItemFooter className="border-t border-gray-6 pt-4">
                        <BrandColorPreview color={field.value} />
                      </ItemFooter>
                    )}
                  </Item>
                </FormItem>
              )}
            />

            <Item variant="outline">
              <ItemContent>
                <ItemTitle>
                  <label htmlFor="customThemeColors">
                    {t('Advanced customization')}
                  </label>
                </ItemTitle>
                <ItemDescription>
                  {t('Set your own shade, status and link colors.')}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <FormField
                  control={form.control}
                  name="customThemeColors"
                  render={({ field }) => (
                    <Switch
                      id="customThemeColors"
                      disabled={brandingLocked}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </ItemActions>
              {form.watch('customThemeColors') && !brandingLocked && (
                <ItemFooter className="flex-col items-stretch gap-5 border-t border-gray-6 pt-4">
                  {THEME_COLOR_GROUPS.map((group) => (
                    <div key={group.label} className="flex flex-col gap-3">
                      <span className="text-xs font-medium text-gray-11">
                        {t(group.label)}
                      </span>
                      <div className="grid grid-cols-3 gap-x-4 gap-y-3">
                        {group.fields.map(({ name, label }) => (
                          <FormField
                            key={name}
                            control={form.control}
                            name={name}
                            render={({ field }) => (
                              <FormItem className="flex items-center gap-2.5 space-y-0">
                                <ColorPicker
                                  className="size-6 shrink-0"
                                  value={field.value as string}
                                  onChange={(color: string) =>
                                    field.onChange(color)
                                  }
                                />
                                <div className="flex min-w-0 flex-col">
                                  <FormLabel className="font-normal">
                                    {t(label)}
                                  </FormLabel>
                                  <span className="font-mono text-xs uppercase text-gray-11">
                                    {field.value as string}
                                  </span>
                                  <FormMessage />
                                </div>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </ItemFooter>
              )}
            </Item>
          </div>

          {form?.formState?.errors?.root?.serverError && (
            <FormMessage>
              {form.formState.errors.root.serverError.message}
            </FormMessage>
          )}
          <div className="flex gap-2 justify-end mt-4">
            {form.formState.isDirty && (
              <Button
                type="button"
                variant="outline"
                onClick={() => form.reset()}
              >
                {t('Cancel')}
              </Button>
            )}
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
  color: hexColor,
  customThemeColors: z.boolean(),
  themeColors: ThemeColorsSchema,
});

const THEME_COLOR_GROUPS: {
  label: string;
  fields: { name: FieldPath<PlatformAppearanceSchema>; label: string }[];
}[] = [
  {
    label: 'Brand shades',
    fields: [
      { name: 'themeColors.primary.light', label: 'Primary Light' },
      { name: 'themeColors.primary.medium', label: 'Primary Medium' },
      { name: 'themeColors.primary.dark', label: 'Primary Dark' },
    ],
  },
  {
    label: 'Status',
    fields: [
      { name: 'themeColors.danger', label: 'Danger' },
      { name: 'themeColors.warn.default', label: 'Warning' },
      { name: 'themeColors.warn.light', label: 'Warning Light' },
      { name: 'themeColors.warn.dark', label: 'Warning Dark' },
      { name: 'themeColors.success.default', label: 'Success' },
      { name: 'themeColors.success.light', label: 'Success Light' },
    ],
  },
  {
    label: 'Other',
    fields: [
      { name: 'themeColors.blue-link', label: 'Link' },
      { name: 'themeColors.avatar', label: 'Avatar' },
      { name: 'themeColors.selection', label: 'Selection' },
    ],
  },
];

type PlatformAppearanceSchema = z.infer<typeof PlatformAppearanceSchema>;
