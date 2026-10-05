import { isNil } from '@activepieces/core-utils';
import {
  brandColors,
  formErrors,
  HEX_COLOR_PATTERN,
  PlatformThemeColors,
  StatusColors,
  StatusScale,
  ThemeHexColor,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { Upload, X } from 'lucide-react';
import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { platformApi } from '@/api/platforms-api';
import { AdminPageHeader } from '@/app/routes/platform/admin-page-header';
import { ColorPicker } from '@/components/custom/color-picker';
import { LogoPlate } from '@/components/custom/logo-plate';
import { Page } from '@/components/custom/page';
import { Panel, SettingRow, SettingRows } from '@/components/custom/panel';
import { StatusDot } from '@/components/custom/status-dot';
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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { PlanBadge } from '@/features/billing/components/plan-badge';
import { TIER_LABELS } from '@/features/billing/utils/feature-tier';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { brandSeed } from '@/lib/brand-seed';

import { ColorPreview, ColorTone } from './color-preview';

export const AppearanceSection = ({
  ownerRow,
  panels,
  dangerZone,
}: AppearanceSectionProps) => {
  const queryClient = useQueryClient();
  const { platform } = platformHooks.useCurrentPlatform();
  const branding = flagsHooks.useWebsiteBranding();
  const brandingLocked = !platform.plan.customAppearanceEnabled;
  const initialColor = HEX_COLOR_PATTERN.test(platform.primaryColor)
    ? platform.primaryColor
    : branding.colors.primary.default;
  const [images, setImages] = useState<BrandImages>({});
  const storedStatusColors = brandingLocked
    ? branding.statusColors
    : platform.themeColors?.status;

  const form = useForm<PlatformAppearanceSchema>({
    defaultValues: {
      name: platform.name,
      color: initialColor,
      statusColors: {
        danger: storedStatusColors?.danger,
        warning: storedStatusColors?.warning,
        success: storedStatusColors?.success,
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
  const imagesChanged = Object.values(images).some((image) => !isNil(image));
  const { isDirty, errors } = form.formState;
  const hasFieldErrors = Object.keys(errors).some((field) => field !== 'root');
  const dirty = isDirty || imagesChanged;
  const serverError = form.formState.errors.root?.serverError?.message;

  useEffect(() => {
    if (brandingLocked) {
      return;
    }
    brandSeed.setPreview({
      primaryColor: HEX_COLOR_PATTERN.test(previewColor)
        ? previewColor
        : savedColor,
      statusColors: {
        danger: previewDanger,
        warning: previewWarning,
        success: previewSuccess,
      },
    });
    return () => brandSeed.clearPreview();
  }, [
    brandingLocked,
    previewColor,
    previewDanger,
    previewWarning,
    previewSuccess,
    savedColor,
  ]);

  const statusLabels: Record<StatusScale, string> = {
    danger: t('Danger'),
    warning: t('Warning'),
    success: t('Success'),
  };

  const setImage = ({
    kind,
    file,
  }: {
    kind: BrandImageKind;
    file: File | null;
  }) => {
    setImages((previous) => {
      const current = previous[kind];
      if (current) {
        URL.revokeObjectURL(current.url);
      }
      return {
        ...previous,
        [kind]: file ? { file, url: URL.createObjectURL(file) } : undefined,
      };
    });
  };

  const discard = () => {
    BRAND_IMAGES.forEach(({ kind }) => setImage({ kind, file: null }));
    form.reset();
  };

  const { mutate: updatePlatform, isPending } = useMutation({
    mutationFn: async () => {
      form.clearErrors('root.serverError');
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
        BRAND_IMAGES.forEach(({ kind, field }) => {
          const image = images[kind];
          if (image) formdata.append(field, image.file);
        });
      }

      await platformApi.updateWithFormData(formdata, platform.id);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['platform', platform.id] }),
        queryClient.invalidateQueries({ queryKey: flagsHooks.queryKey }),
      ]);
    },
    onSuccess: () => {
      BRAND_IMAGES.forEach(({ kind }) => setImage({ kind, file: null }));
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
    <Form {...form}>
      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={form.handleSubmit(() => updatePlatform())}
      >
        <Page
          width="narrow"
          footer={
            dirty || serverError ? (
              <>
                {serverError ? (
                  <span className="flex-1 text-sm text-danger-11">
                    {serverError}
                  </span>
                ) : (
                  <StatusDot tone="warning" className="flex-1 text-gray-11">
                    {t('You have unsaved changes')}
                  </StatusDot>
                )}
                <Button type="button" variant="outline" onClick={discard}>
                  {t('Discard')}
                </Button>
                <Button
                  {...adminControl(AdminControl.GENERAL_APPEARANCE_SUBMIT)}
                  type="submit"
                  loading={isPending}
                  disabled={hasFieldErrors}
                >
                  {t('Save')}
                </Button>
              </>
            ) : undefined
          }
        >
          <AdminPageHeader page="general" />

          <Panel title={t('Platform')} flush>
            <SettingRows>
              <FormField
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <SettingRow
                    title={<label htmlFor="name">{t('Platform name')}</label>}
                    description={
                      fieldState.error ? (
                        <span className="text-danger-11">
                          {t(fieldState.error.message ?? '')}
                        </span>
                      ) : (
                        t('Shown in the sidebar, emails and the sign-in page.')
                      )
                    }
                  >
                    <Input
                      {...field}
                      id="name"
                      aria-invalid={!!fieldState.error}
                      className="w-56"
                    />
                  </SettingRow>
                )}
              />
              {ownerRow}
            </SettingRows>
          </Panel>

          <Panel
            title={t('Branding')}
            description={t(
              'Your logo and colours replace ours everywhere, including sign-in and emails.',
            )}
            action={brandingLocked ? <PlanBadge tier="enterprise" /> : null}
            flush
          >
            <SettingRows>
              {BRAND_IMAGES.map((image) => (
                <BrandImageRow
                  key={image.kind}
                  title={t(image.title)}
                  hint={t(image.hint)}
                  currentUrl={platform[image.urlKey]}
                  selected={images[image.kind]}
                  disabled={brandingLocked}
                  onSelect={(file) => setImage({ kind: image.kind, file })}
                />
              ))}
            </SettingRows>
            <div className="flex flex-col gap-4 border-t border-gray-6 p-5">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-12">
                  {t('Colors')}
                </span>
                <span className="text-xs text-gray-11">
                  {t('Your brand and status colors.')}
                </span>
              </div>
              <div className="@container">
                <div className="grid grid-cols-1 gap-3 @lg:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <ColorRow
                        tone="primary"
                        label={t('Primary')}
                        color={field.value}
                        defaultColor={brandColors.defaultPrimaryColor()}
                        isDefault={
                          field.value.toLowerCase() ===
                          brandColors.defaultPrimaryColor()
                        }
                        disabled={brandingLocked}
                        onChange={field.onChange}
                        onReset={() =>
                          field.onChange(brandColors.defaultPrimaryColor())
                        }
                      />
                    )}
                  />
                  {brandColors.statusScales.map((scale) => (
                    <FormField
                      key={scale}
                      control={form.control}
                      name={`statusColors.${scale}`}
                      render={({ field }) => (
                        <ColorRow
                          tone={scale}
                          label={statusLabels[scale]}
                          color={field.value}
                          defaultColor={brandColors.defaultStatusColor({
                            scale,
                          })}
                          isDefault={isNil(field.value)}
                          disabled={brandingLocked}
                          onChange={field.onChange}
                          onReset={() => field.onChange(undefined)}
                        />
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          {panels}

          {dangerZone}
        </Page>
      </form>
    </Form>
  );
};

const ColorRow = ({
  tone,
  label,
  color,
  defaultColor,
  isDefault,
  disabled,
  onChange,
  onReset,
}: ColorRowProps) => {
  const shownColor = color ?? defaultColor;
  return (
    <FormItem className="flex flex-col gap-3 space-y-0 rounded-lg border border-gray-6 p-3">
      <div className="flex items-center gap-3">
        <LockedHint locked={disabled}>
          <ColorPicker
            side="top"
            aria-label={label}
            disabled={disabled}
            value={shownColor}
            onChange={onChange}
            className="shrink-0"
          />
        </LockedHint>
        <div className="flex min-w-0 flex-1 flex-col">
          <FormLabel className="font-normal">{label}</FormLabel>
          <span className="text-xs text-gray-11">
            <span className="font-mono">{shownColor.toUpperCase()}</span>
            {isDefault && ` · ${t('Default')}`}
          </span>
        </div>
        <Button
          {...adminControl(AdminControl.GENERAL_COLOUR_RESET_RUN)}
          type="button"
          variant="ghost"
          size="sm"
          aria-label={t('Reset {name}', { name: label })}
          disabled={disabled || isDefault}
          onClick={onReset}
        >
          {t('Reset')}
        </Button>
      </div>
      <FormMessage />
      <ColorPreview tone={tone} />
    </FormItem>
  );
};

const BrandImageRow = ({
  title,
  hint,
  currentUrl,
  selected,
  disabled,
  onSelect,
}: BrandImageRowProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <SettingRow
      title={title}
      description={selected ? selected.file.name : hint}
    >
      <LogoPlate
        src={selected?.url ?? currentUrl}
        alt={title}
        size="md"
        border
      />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        disabled={disabled}
        onChange={(event) => {
          onSelect(event.target.files?.[0] ?? null);
          event.target.value = '';
        }}
      />
      <LockedHint locked={disabled}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          <Upload />
          {t('Upload')}
        </Button>
      </LockedHint>
      {selected && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t('Undo')}
          onClick={() => onSelect(null)}
        >
          <X />
        </Button>
      )}
    </SettingRow>
  );
};

const LockedHint = ({
  locked,
  children,
}: {
  locked: boolean;
  children: React.ReactNode;
}) => {
  if (!locked) {
    return <>{children}</>;
  }
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span tabIndex={0} className="flex items-center gap-2">
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {t('Available on the {tier} plan', { tier: TIER_LABELS.enterprise })}
      </TooltipContent>
    </Tooltip>
  );
};

const PlatformAppearanceSchema = z.object({
  name: z.string().min(1, formErrors.required),
  color: ThemeHexColor,
  statusColors: PlatformThemeColors.shape.status.unwrap(),
});

const BRAND_IMAGES: BrandImageSpec[] = [
  {
    kind: 'logo',
    field: 'fullLogo',
    urlKey: 'fullLogoUrl',
    title: 'Logo',
    hint: 'The full logo in the sidebar, emails and the sign-in page.',
  },
  {
    kind: 'icon',
    field: 'logoIcon',
    urlKey: 'logoIconUrl',
    title: 'Icon',
    hint: 'The square mark used where the full logo does not fit.',
  },
  {
    kind: 'favicon',
    field: 'favIcon',
    urlKey: 'favIconUrl',
    title: 'Favicon',
    hint: 'The small icon in the browser tab.',
  },
];

function withStatusColors({
  themeColors,
  statusColors,
}: {
  themeColors: PlatformThemeColors | null | undefined;
  statusColors: StatusColors;
}): PlatformThemeColors {
  const hasStatusColor = Object.values(statusColors).some(
    (color) => !isNil(color),
  );
  return {
    ...themeColors,
    status: hasStatusColor ? statusColors : undefined,
  };
}

type PlatformAppearanceSchema = z.infer<typeof PlatformAppearanceSchema>;

type BrandImageKind = 'logo' | 'icon' | 'favicon';

type BrandImageSelection = { file: File; url: string };

type BrandImages = Partial<Record<BrandImageKind, BrandImageSelection>>;

type BrandImageSpec = {
  kind: BrandImageKind;
  field: 'fullLogo' | 'logoIcon' | 'favIcon';
  urlKey: 'fullLogoUrl' | 'logoIconUrl' | 'favIconUrl';
  title: string;
  hint: string;
};

type BrandImageRowProps = {
  title: string;
  hint: string;
  currentUrl: string;
  selected: BrandImageSelection | undefined;
  disabled: boolean;
  onSelect: (file: File | null) => void;
};

type ColorRowProps = {
  tone: ColorTone;
  label: string;
  color: string | undefined;
  defaultColor: string;
  isDefault: boolean;
  disabled: boolean;
  onChange: (color: string | undefined) => void;
  onReset: () => void;
};

type AppearanceSectionProps = {
  ownerRow?: React.ReactNode;
  panels?: React.ReactNode;
  dangerZone?: React.ReactNode;
};
