import {
  AIProviderWithoutSensitiveData,
  CreatePlatformModelTierRequest,
  formErrors,
  PlatformModelTier,
  PlatformModelTierEntry,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { ChevronDown, Plus } from 'lucide-react';
import { KeyboardEvent, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  KeyModelsById,
  modelMeta,
} from '@/features/agents/ai-model/model-meta';
import { ModelRow } from '@/features/agents/ai-model/model-row';
import { platformModelTierMutations } from '@/features/platform-admin/hooks/platform-model-tier-hooks';
import { AdminControl, adminControl } from '@/lib/admin-control';
import { cn } from '@/lib/utils';

import { AdminModelPicker } from './admin-model-picker';
import { tierEmojis } from './tier-emojis';
import { tierThinking } from './tier-thinking';

export function TierDialog({
  state,
  onOpenChange,
  ownKeys,
  keyModels,
  returnFocusTo,
  onReturnFocus,
  onSaved,
}: TierDialogProps) {
  return (
    <Dialog open={state.open} onOpenChange={onOpenChange}>
      {state.open && (
        <TierForm
          key={state.mode === 'edit' ? state.tier.id : 'new'}
          state={state}
          ownKeys={ownKeys}
          keyModels={keyModels}
          onCancel={() => onOpenChange(false)}
          onReturnFocus={() => onReturnFocus({ target: returnFocusTo ?? null })}
          onSaved={(tier) => {
            onSaved?.(tier);
            onOpenChange(false);
          }}
        />
      )}
    </Dialog>
  );
}

function TierForm({
  state,
  ownKeys,
  keyModels,
  onCancel,
  onReturnFocus,
  onSaved,
}: {
  state: OpenTierDialogState;
  ownKeys: AIProviderWithoutSensitiveData[];
  keyModels: KeyModelsById;
  onCancel: () => void;
  onReturnFocus: () => void;
  onSaved: (tier: PlatformModelTier) => void;
}) {
  const editing = state.mode === 'edit' ? state.tier : undefined;
  const [showAllEmojis, setShowAllEmojis] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const form = useForm<TierFormValues>({
    resolver: zodResolver(formSchema({ requireMain: editing === undefined })),
    mode: 'onChange',
    defaultValues: defaultValuesOf({ state }),
  });
  const { mutate: create, isPending: creating } =
    platformModelTierMutations.useCreate();
  const { mutate: update, isPending: updating } =
    platformModelTierMutations.useUpdate();
  const saving = creating || updating;
  const keepOpen = (event: Event) => {
    if (saving) {
      event.preventDefault();
    }
  };

  const submit = (values: TierFormValues) => {
    const shared = {
      name: values.name.trim(),
      emoji: values.emoji,
      description:
        values.description.trim() === '' ? null : values.description.trim(),
      thinkingBudget: tierThinking.budgetOf({
        value: values.thinking,
        current: editing?.thinkingBudget ?? null,
      }),
    };
    if (editing !== undefined) {
      update({ id: editing.id, request: shared }, { onSuccess: onSaved });
      return;
    }
    if (values.main === undefined) {
      return;
    }
    const request: CreatePlatformModelTierRequest = {
      ...shared,
      entries: [values.main],
    };
    create(request, { onSuccess: onSaved });
  };

  const currentThinking = editing?.thinkingBudget ?? null;
  const customThinking =
    tierThinking.presetOf({ budget: currentThinking }) === undefined &&
    currentThinking !== null;
  const emojis = showAllEmojis ? tierEmojis.all : tierEmojis.quick;

  return (
    <DialogContent
      className="sm:max-w-md"
      showCloseButton={!saving}
      onEscapeKeyDown={keepOpen}
      onPointerDownOutside={keepOpen}
      onInteractOutside={keepOpen}
      onCloseAutoFocus={(event) => {
        event.preventDefault();
        onReturnFocus();
      }}
    >
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(submit)}
          className="flex flex-col gap-5"
        >
          <DialogHeader>
            <DialogTitle>
              {editing ? t('Edit tier') : t('New tier')}
            </DialogTitle>
            <DialogDescription>
              {t('Builders see this name and emoji when they pick a tier.')}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-start gap-3">
            <FormField
              control={form.control}
              name="emoji"
              render={({ field }) => (
                <FormItem className="flex flex-col gap-1.5">
                  <FormLabel>{t('Emoji')}</FormLabel>
                  <span
                    className="flex size-9 items-center justify-center rounded-md border border-gray-6 bg-panel text-xl"
                    aria-hidden="true"
                  >
                    {field.value}
                  </span>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex flex-1 flex-col gap-1.5">
                  <FormLabel showRequiredIndicator>{t('Name')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoFocus
                      maxLength={NAME_MAX_LENGTH}
                      placeholder={t('e.g. Expert')}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="emoji"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1.5">
                <FormLabel>{t('Pick an emoji')}</FormLabel>
                <div
                  role="radiogroup"
                  aria-label={t('Pick an emoji')}
                  className="flex flex-wrap gap-1.5"
                  onKeyDown={moveFocusWithArrows}
                >
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      role="radio"
                      aria-checked={field.value === emoji}
                      aria-label={emoji}
                      tabIndex={field.value === emoji ? 0 : -1}
                      onClick={() => field.onChange(emoji)}
                      className={cn(
                        'flex size-8 items-center justify-center rounded-md border text-base transition-colors hover:bg-gray-3 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent-8',
                        field.value === emoji
                          ? 'border-accent-8 bg-accent-3'
                          : 'border-gray-6 bg-panel',
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                  {!showAllEmojis && (
                    <button
                      type="button"
                      aria-label={t('More emojis')}
                      onClick={() => setShowAllEmojis(true)}
                      className="flex size-8 items-center justify-center rounded-md border border-dashed border-gray-7 text-gray-11 hover:bg-gray-3 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent-8"
                    >
                      <Plus className="size-4" />
                    </button>
                  )}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1.5">
                <FormLabel>{t('Description')}</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={2}
                    maxLength={DESCRIPTION_MAX_LENGTH}
                    placeholder={t('e.g. Best for everyday use')}
                  />
                </FormControl>
                <FormDescription className="text-right text-xs tabular-nums">
                  {field.value.length}/{DESCRIPTION_MAX_LENGTH}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {editing === undefined && (
            <FormField
              control={form.control}
              name="main"
              render={({ field }) => {
                const pickedConfig = ownKeys.find(
                  (config) => config.id === field.value?.configId,
                );
                const pickedModel =
                  field.value === undefined
                    ? undefined
                    : modelMeta.catalogModel({ keyModels, entry: field.value });
                return (
                  <FormItem className="flex flex-col gap-1.5">
                    <FormLabel showRequiredIndicator>
                      {t('Main model')}
                    </FormLabel>
                    <AdminModelPicker
                      configs={ownKeys}
                      keyModels={keyModels}
                      exclude={[]}
                      mode="main"
                      align="start"
                      open={pickerOpen}
                      onOpenChange={setPickerOpen}
                      onPick={(entry) => field.onChange(entry)}
                    >
                      <Button
                        type="button"
                        variant="outline"
                        className="h-auto min-h-9 justify-between px-3 py-1.5"
                        aria-label={t('Main model')}
                      >
                        {field.value !== undefined &&
                        pickedModel !== undefined ? (
                          <ModelRow
                            model={pickedModel}
                            info={
                              pickedConfig === undefined
                                ? undefined
                                : modelMeta.providerInfoOf({
                                    provider: pickedConfig.provider,
                                  })
                            }
                            keyName={pickedConfig?.name}
                          />
                        ) : field.value !== undefined ? (
                          <span className="truncate text-sm">
                            {field.value.modelId}
                          </span>
                        ) : (
                          <span className="text-gray-11">
                            {t('Pick a model')}
                          </span>
                        )}
                        <ChevronDown className="size-4 shrink-0 opacity-60" />
                      </Button>
                    </AdminModelPicker>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
          )}

          <FormField
            control={form.control}
            name="thinking"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-1.5">
                <FormLabel>{t('Thinking')}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customThinking && (
                      <SelectItem value={tierThinking.CUSTOM_VALUE}>
                        {t('Custom ({budget} tokens)', {
                          budget: currentThinking.toLocaleString(),
                        })}
                      </SelectItem>
                    )}
                    {tierThinking.presets().map((preset) => (
                      <SelectItem key={preset.value} value={preset.value}>
                        {preset.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs">
                  {t('Used only by models that support reasoning.')}
                </FormDescription>
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={saving}
            >
              {t('Cancel')}
            </Button>
            <Button
              type="submit"
              loading={saving}
              {...adminControl(AdminControl.AI_TIER_SUBMIT)}
            >
              {t('Save tier')}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}

function moveFocusWithArrows(event: KeyboardEvent<HTMLDivElement>) {
  if (
    !['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(event.key)
  ) {
    return;
  }
  const radios = Array.from(
    event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]'),
  );
  const current = radios.indexOf(document.activeElement as HTMLButtonElement);
  if (current === -1) {
    return;
  }
  event.preventDefault();
  const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown';
  const next =
    radios[(current + (forward ? 1 : radios.length - 1)) % radios.length];
  next.focus();
  next.click();
}

function formSchema({ requireMain }: { requireMain: boolean }) {
  return z
    .object({
      name: CreatePlatformModelTierRequest.shape.name,
      emoji: CreatePlatformModelTierRequest.shape.emoji,
      description: z
        .string()
        .trim()
        .max(DESCRIPTION_MAX_LENGTH, formErrors.tierDescriptionTooLong),
      thinking: z.string(),
      main: PlatformModelTierEntry.optional(),
    })
    .superRefine((values, context) => {
      if (requireMain && values.main === undefined) {
        context.addIssue({
          code: 'custom',
          path: ['main'],
          message: formErrors.required,
        });
      }
    });
}

function defaultValuesOf({
  state,
}: {
  state: OpenTierDialogState;
}): TierFormValues {
  if (state.mode === 'edit') {
    return {
      name: state.tier.name,
      emoji: state.tier.emoji,
      description: state.tier.description ?? '',
      thinking: tierThinking.valueOf({
        budget: state.tier.thinkingBudget ?? null,
      }),
      main: undefined,
    };
  }
  return {
    name: '',
    emoji: tierEmojis.defaultEmoji,
    description: '',
    thinking: tierThinking.valueOf({ budget: null }),
    main: state.initialMain,
  };
}

const NAME_MAX_LENGTH = 40;
const DESCRIPTION_MAX_LENGTH = 120;

type TierFormValues = z.infer<ReturnType<typeof formSchema>>;

export type TierDialogState =
  | { open: false }
  | { open: true; mode: 'create'; initialMain?: PlatformModelTierEntry }
  | { open: true; mode: 'edit'; tier: PlatformModelTier };

type OpenTierDialogState = Extract<TierDialogState, { open: true }>;

type TierDialogProps = {
  state: TierDialogState;
  onOpenChange: (open: boolean) => void;
  ownKeys: AIProviderWithoutSensitiveData[];
  keyModels: KeyModelsById;
  returnFocusTo?: HTMLElement | null;
  onReturnFocus: (args: { target: HTMLElement | null }) => void;
  onSaved?: (tier: PlatformModelTier) => void;
};
