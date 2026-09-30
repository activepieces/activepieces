import {
  brandColors,
  formErrors,
  HEX_COLOR_PATTERN,
  PlatformThemeColors,
  STATUS_SCALES,
  StatusColors,
  StatusScale,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { brandSeed } from '@/lib/brand-seed';

import {
  ColorPreview,
  ColorTone,
  ContrastWarning,
  PreviewTheme,
  PreviewThemeSwitch,
} from './color-preview';

export const AppearanceSection = () => {
  const queryClient = useQueryClient();
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
      statusColors: {
        danger: branding.statusColors.danger,
        warning: branding.statusColors.warning,
        success: branding.statusColors.success,
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
  const [previewDanger, previewWarning, previewSuccess] = form.watch([
    'statusColors.danger',
    'statusColors.warning',
    'statusColors.success',
  ]);
  const savedColor = branding.colors.primary.default;
  const savedStatusColors = branding.statusColors;

  useEffect(() => {
    if (brandingLocked) {
      return;
    }
    brandSeed.apply({
      primaryColor: HEX_COLOR_PATTERN.test(previewColor)
        ? previewColor
        : savedColor,
      statusColors: {
        danger: previewDanger,
        warning: previewWarning,
        success: previewSuccess,
      },
    });
  }, [
    brandingLocked,
    previewColor,
    previewDanger,
    previewWarning,
    previewSuccess,
    savedColor,
  ]);

  useEffect(
    () => () =>
      brandSeed.apply({
        primaryColor: savedColor,
        statusColors: savedStatusColors,
      }),
    [savedColor, savedStatusColors],
  );

  const statusLabels: Record<StatusScale, string> = {
    danger: t('Danger'),
    warning: t('Warning'),
    success: t('Success'),
  };

  const [previewTheme, setPreviewTheme] = useState<PreviewTheme>('light');
  const [fileInputsKey, setFileInputsKey] = useState(0);
  const [hasChosenFiles, setHasChosenFiles] = useState(false);
  const { isDirty, isValid } = form.formState;
  const hasChanges = isDirty || hasChosenFiles;
  const clearChosenFiles = () => {
    setHasChosenFiles(false);
    setFileInputsKey((key) => key + 1);
  };

  const logoRef = useRef<HTMLInputElement>(null);
  const iconRef = useRef<HTMLInputElement>(null);
  const faviconRef = useRef<HTMLInputElement>(null);

  const { mutate: updatePlatform, isPending } = useMutation({
    mutationFn: async () => {
      form.clearErrors('root.serverError');
      const logo = logoRef.current?.files?.[0];
      const icon = iconRef.current?.files?.[0];
      const favicon = faviconRef.current?.files?.[0];
      const { name, color, statusColors } = form.getValues();

      const formdata = new FormData();
      formdata.append('name', name);
      if (!brandingLocked) {
        if (color !== initialColor) {
          formdata.append('primaryColor', color);
        }
        formdata.append(
          'themeColors',
          JSON.stringify(
            withStatusColors({
              themeColors: platform.themeColors,
              statusColors,
            }),
          ),
        );
        if (logo) formdata.append('fullLogo', logo);
        if (icon) formdata.append('logoIcon', icon);
        if (favicon) formdata.append('favIcon', favicon);
      }

      await platformApi.updateWithFormData(formdata, platform.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['platform', platform.id] }),
        queryClient.invalidateQueries({ queryKey: flagsHooks.queryKey }),
      ]);
    },
    onSuccess: () => {
      clearChosenFiles();
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
                key={fileInputsKey}
                ref={logoRef}
                onChange={() => setHasChosenFiles(true)}
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
                key={fileInputsKey}
                ref={iconRef}
                onChange={() => setHasChosenFiles(true)}
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
                key={fileInputsKey}
                ref={faviconRef}
                onChange={() => setHasChosenFiles(true)}
                defaultFileName={platform.favIconUrl}
                accept="image/*"
                id="faviconFile"
                disabled={brandingLocked}
                className="rounded-sm"
              />
            </div>

            <Item variant="outline">
              <ItemContent>
                <ItemTitle>{t('Colors')}</ItemTitle>
                <ItemDescription className="line-clamp-none">
                  {t(
                    'Each color sets its whole scale, in light and dark mode.',
                  )}{' '}
                  {t('Changes preview across the app until you save.')}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <PreviewThemeSwitch
                  theme={previewTheme}
                  onChange={setPreviewTheme}
                />
              </ItemActions>
              <ItemFooter className="@container block border-t border-gray-6 pt-4">
                <div className="grid grid-cols-1 gap-3 @lg:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <ColorRow
                        tone="primary"
                        previewTheme={previewTheme}
                        label={t('Primary')}
                        color={field.value}
                        defaultColor={brandColors.defaultPrimaryColor()}
                        disabled={brandingLocked}
                        onChange={field.onChange}
                        onReset={() =>
                          field.onChange(brandColors.defaultPrimaryColor())
                        }
                      />
                    )}
                  />
                  {STATUS_SCALES.map((scale) => (
                    <FormField
                      key={scale}
                      control={form.control}
                      name={`statusColors.${scale}`}
                      render={({ field }) => (
                        <ColorRow
                          tone={scale}
                          previewTheme={previewTheme}
                          label={statusLabels[scale]}
                          color={field.value}
                          defaultColor={brandColors.defaultStatusColor({
                            scale,
                          })}
                          disabled={brandingLocked}
                          onChange={field.onChange}
                          onReset={() => field.onChange(undefined)}
                        />
                      )}
                    />
                  ))}
                </div>
              </ItemFooter>
            </Item>

            {form?.formState?.errors?.root?.serverError && (
              <FormMessage>
                {form.formState.errors.root.serverError.message}
              </FormMessage>
            )}
            <div className="flex items-center justify-between gap-3 border-t border-gray-6 pt-4">
              <span className="text-sm text-gray-11">
                {hasChanges && (
                  <span className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-warning-9" />
                    {t('You have unsaved changes')}
                  </span>
                )}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!hasChanges || isPending}
                  onClick={() => {
                    form.reset();
                    clearChosenFiles();
                  }}
                >
                  {t('Cancel')}
                </Button>
                <Button
                  type="submit"
                  loading={isPending}
                  disabled={!hasChanges || !isValid}
                >
                  {t('Save')}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

const hexColor = z.string().regex(HEX_COLOR_PATTERN, 'invalidHexColor');

const ColorRow = ({
  tone,
  previewTheme,
  label,
  color,
  defaultColor,
  disabled,
  onChange,
  onReset,
}: ColorRowProps) => {
  const shownColor = color ?? defaultColor;
  const isDefault = shownColor.toLowerCase() === defaultColor.toLowerCase();
  return (
    <FormItem className="flex flex-col gap-3 space-y-0 rounded-md border border-gray-6 p-3">
      <div className="flex items-center gap-3">
        <ColorPicker
          side="top"
          disabled={disabled}
          value={shownColor}
          onChange={onChange}
          className="shrink-0"
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <FormLabel className="font-normal">{label}</FormLabel>
          <span className="text-xs text-gray-11">
            <span className="font-mono uppercase">{shownColor}</span>
            {isDefault && ` · ${t('Default')}`}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled || isDefault}
          onClick={onReset}
        >
          {t('Reset')}
        </Button>
      </div>
      <ContrastWarning color={shownColor} />
      <FormMessage />
      <ColorPreview tone={tone} theme={previewTheme} />
    </FormItem>
  );
};

function withStatusColors({
  themeColors,
  statusColors,
}: {
  themeColors: PlatformThemeColors | null | undefined;
  statusColors: StatusColors;
}): PlatformThemeColors {
  const warn = { ...themeColors?.warn, default: statusColors.warning };
  const success = { ...themeColors?.success, default: statusColors.success };
  return {
    ...themeColors,
    danger: statusColors.danger,
    warn: hasAnyColor({ group: warn }) ? warn : undefined,
    success: hasAnyColor({ group: success }) ? success : undefined,
  };
}

function hasAnyColor({
  group,
}: {
  group: Record<string, string | undefined>;
}): boolean {
  return Object.values(group).some((color) => color !== undefined);
}

const PlatformAppearanceSchema = z.object({
  name: z.string().min(1, formErrors.required),
  color: hexColor,
  statusColors: z.object({
    danger: hexColor.optional(),
    warning: hexColor.optional(),
    success: hexColor.optional(),
  }),
});

type PlatformAppearanceSchema = z.infer<typeof PlatformAppearanceSchema>;

type ColorRowProps = {
  tone: ColorTone;
  previewTheme: PreviewTheme;
  label: string;
  color: string | undefined;
  defaultColor: string;
  disabled: boolean;
  onChange: (color: string | undefined) => void;
  onReset: () => void;
};
