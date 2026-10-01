import { isNil, Permission } from '@activepieces/core-utils';
import {
  Agent,
  AgentConfig,
  AgentIcon,
  AgentToolType,
  ColorName,
  PICKABLE_COLOR_NAMES,
  DEFAULT_AGENT_MAX_STEPS,
  MAX_AGENT_STEP_BUDGET,
  PROJECT_COLOR_PALETTE,
  PROJECT_COLOR_SWATCH,
  UpdateAgentRequest,
  formErrors,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { ChevronRight, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

import { AgentTools } from '@/app/builder/step-settings/agent-settings/agent-tools';
import { Dot } from '@/components/custom/dot';
import {
  LeaveWithoutSavingDialog,
  useWarnBeforeLosingChanges,
} from '@/components/custom/leave-without-saving';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { AIModelSelector, AgentStructuredOutput } from '@/features/agents';
import { AgentMark } from '@/features/agents/agent-mark';
import { DeleteAgentDialog } from '@/features/agents/delete-agent-dialog';
import { agentsMutations } from '@/features/agents/hooks/agents-hooks';
import { MoveAgentDialog } from '@/features/agents/move-agent-dialog';
import {
  ApProjectDisplay,
  getProjectName,
  projectCollectionUtils,
} from '@/features/projects';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

import { agentEditState } from '../../lib/agent-edit-state';

const ConfigureAgentSchema = z.object({
  displayName: z.string().min(1, formErrors.required),
  description: z.string(),
  icon: z.enum(AgentIcon),
  color: z.enum(ColorName),
  draft: AgentConfig,
});

type ConfigureAgentInput = z.input<typeof ConfigureAgentSchema>;
type ConfigureAgentValues = z.output<typeof ConfigureAgentSchema>;

const toUpdateRequest = (values: ConfigureAgentValues): UpdateAgentRequest => ({
  displayName: values.displayName,
  description: values.description.length > 0 ? values.description : null,
  icon: values.icon,
  color: values.color,
  draft: values.draft,
});

const parseProvider = (provider?: string) => {
  const parsed = AgentConfig.shape.provider.safeParse(provider ?? null);
  return parsed.success ? parsed.data : null;
};

const AgentProjectRow = ({ agent }: { agent: Agent }) => {
  const [moving, setMoving] = useState(false);
  const { checkAccess } = useAuthorization(agent.projectId);
  const { data: allProjects } = projectCollectionUtils.useAll();
  const home = (allProjects ?? []).find(
    (project) => project.id === agent.projectId,
  );

  if (
    !checkAccess(Permission.WRITE_AGENT) ||
    (allProjects ?? []).length < 2 ||
    home === undefined
  ) {
    return null;
  }

  return (
    <FormItem className="flex flex-col gap-2">
      <PanelSectionLabel label={t('Project')} />
      <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-6 px-3 py-2">
        <ApProjectDisplay
          title={getProjectName(home)}
          icon={home.icon}
          projectType={home.type}
          titleClassName="text-sm"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setMoving(true)}
        >
          {t('Move')}
        </Button>
      </div>
      <MoveAgentDialog
        agent={agent}
        open={moving}
        onOpenChange={setMoving}
        onMoved={(projectId) =>
          projectCollectionUtils.setCurrentProject(
            projectId,
            `/projects/${agent.projectId}/agents/${agent.id}`,
          )
        }
      />
    </FormItem>
  );
};

const AgentDangerZone = ({
  agent,
  onDeleted,
}: {
  agent: Agent;
  onDeleted: () => void;
}) => {
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const { checkAccess } = useAuthorization(agent.projectId);

  if (!checkAccess(Permission.WRITE_AGENT)) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 border-t border-gray-6 pt-4">
      <PanelSectionLabel label={t('Delete this agent')} />
      <div className="flex items-start justify-between gap-4">
        <span className="text-xs text-gray-11">
          {t(
            'Its instructions, its tools, and every conversation held with it go with it.',
          )}
        </span>
        <DeleteAgentDialog
          agent={agent}
          open={deleting}
          onOpenChange={setDeleting}
          onDeleted={() => {
            onDeleted();
            navigate('/agents');
          }}
        >
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 text-danger-11 hover:text-danger-11"
            onClick={() => setDeleting(true)}
          >
            <Trash2 />
            {t('Delete')}
          </Button>
        </DeleteAgentDialog>
      </div>
    </div>
  );
};

const AdvancedSection = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2 border-t border-gray-6 pt-4">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-fit items-center gap-1.5 text-sm font-medium text-gray-11 transition-colors hover:text-gray-12"
      >
        <ChevronRight
          className={cn('size-4 transition-transform', open && 'rotate-90')}
        />
        {t('Advanced')}
      </button>
      {open && <div className="flex flex-col gap-4 pt-2">{children}</div>}
    </div>
  );
};

const ConfigureBehaviorTab = ({
  form,
  needsModel,
}: {
  form: ReturnType<
    typeof useForm<ConfigureAgentInput, unknown, ConfigureAgentValues>
  >;
  needsModel: boolean;
}) => {
  const tools = form.watch('draft.tools') ?? [];
  const knowledgeCount = tools.filter(
    (tool) => tool.type === AgentToolType.KNOWLEDGE_BASE,
  ).length;

  return (
    <>
      <FormField
        control={form.control}
        name="draft.instructions"
        render={({ field }) => (
          <FormItem className="flex flex-col gap-2">
            <PanelSectionLabel label={t('Instructions')} />
            <FormControl>
              <Textarea
                {...field}
                minRows={4}
                maxRows={12}
                placeholder={t(
                  'Reply to refund requests. Check the order in Stripe first, and escalate anything over $200.',
                )}
                className="text-sm"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormItem className="flex flex-col gap-2">
        <PanelSectionLabel label={t('Model')} />
        {needsModel && (
          <p className="text-xs text-danger-11">
            {t('Pick a model so this agent can answer.')}
          </p>
        )}
        <AIModelSelector
          hideLabel
          showEmbeddingNote={knowledgeCount > 0}
          defaultProvider={form.watch('draft.provider') ?? undefined}
          defaultModel={form.watch('draft.modelName') ?? undefined}
          defaultConfigId={form.watch('draft.providerConfigId') ?? undefined}
          onChange={({ provider, model, configId, picked: pickedBy }) => {
            const picked = {
              provider: parseProvider(provider) ?? null,
              modelName: model ?? null,
              providerConfigId: configId ?? null,
            };
            if (
              !agentEditState.modelPickChanged({
                picked,
                current: form.getValues('draft'),
              })
            ) {
              return;
            }
            const shouldDirty = pickedBy !== 'default';
            form.setValue('draft.provider', picked.provider, { shouldDirty });
            form.setValue('draft.modelName', picked.modelName, { shouldDirty });
            form.setValue('draft.providerConfigId', picked.providerConfigId, {
              shouldDirty,
            });
          }}
        />
      </FormItem>
      <FormField
        control={form.control}
        name="draft.tools"
        render={({ field }) => (
          <FormItem className="flex flex-col gap-2">
            <AgentTools
              toolsField={field}
              selectedProvider={form.watch('draft.provider') ?? undefined}
            />
            <FormMessage />
          </FormItem>
        )}
      />
      <AdvancedSection>
        <FormField
          control={form.control}
          name="draft.structuredOutput"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <AgentStructuredOutput
                disabled={false}
                structuredOutputField={field}
              />
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="draft.maxSteps"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-2">
              <PanelSectionLabel label={t('Max steps')} />
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={MAX_AGENT_STEP_BUDGET}
                  value={field.value}
                  onChange={(event) =>
                    field.onChange(
                      Number(event.target.value) || DEFAULT_AGENT_MAX_STEPS,
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </AdvancedSection>
    </>
  );
};

const ConfigureSettingsTab = ({
  agent,
  form,
  onDeleted,
}: {
  agent: Agent;
  form: ReturnType<
    typeof useForm<ConfigureAgentInput, unknown, ConfigureAgentValues>
  >;
  onDeleted: () => void;
}) => (
  <>
    <FormField
      control={form.control}
      name="displayName"
      render={({ field }) => (
        <FormItem className="flex flex-col gap-2">
          <PanelSectionLabel label={t('Name')} />
          <FormControl>
            <Input {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      control={form.control}
      name="description"
      render={({ field }) => (
        <FormItem className="flex flex-col gap-2">
          <PanelSectionLabel label={t('Description')} />
          <FormControl>
            <Textarea {...field} minRows={2} maxRows={4} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      control={form.control}
      name="icon"
      render={({ field }) => (
        <FormItem className="flex flex-col gap-2">
          <PanelSectionLabel label={t('Shape')} />
          <div className="grid grid-cols-6 gap-2 rounded-xl border border-gray-6 p-3">
            {Object.values(AgentIcon).map((iconName) => (
              <button
                key={iconName}
                type="button"
                aria-label={iconName}
                onClick={() => field.onChange(iconName)}
                className={cn(
                  'flex items-center justify-center rounded-lg p-0.5',
                  field.value === iconName && 'ring-2 ring-gray-12',
                )}
              >
                <AgentMark
                  icon={iconName}
                  color={form.watch('color')}
                  size="sm"
                />
              </button>
            ))}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
    <FormField
      control={form.control}
      name="color"
      render={({ field }) => (
        <FormItem className="flex flex-col gap-2">
          <PanelSectionLabel label={t('Color')} />
          <div className="grid grid-cols-6 gap-2 rounded-xl border border-gray-6 p-3">
            {PICKABLE_COLOR_NAMES.map((colorName) => (
              <button
                key={colorName}
                type="button"
                aria-label={colorName}
                onClick={() => field.onChange(colorName)}
                className={cn(
                  'flex items-center justify-center rounded-full p-0.5',
                  PROJECT_COLOR_SWATCH[field.value] ===
                    PROJECT_COLOR_SWATCH[colorName] && 'ring-2 ring-gray-12',
                )}
              >
                <span
                  className="size-6 rounded-full"
                  style={{
                    backgroundColor: PROJECT_COLOR_PALETTE[colorName].color,
                  }}
                />
              </button>
            ))}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
    <AgentProjectRow agent={agent} />
    <AgentDangerZone agent={agent} onDeleted={onDeleted} />
  </>
);

const PanelSectionLabel = ({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) => (
  <FormLabel showRequiredIndicator={required} className="text-sm font-medium">
    {label}
  </FormLabel>
);

const formValuesOf = (agent: Agent): ConfigureAgentInput => ({
  displayName: agent.displayName,
  description: agent.description ?? '',
  icon: agent.icon,
  color: agent.color,
  draft: agent.draft,
});

const liveValuesOf = (agent: Agent): ConfigureAgentInput | null =>
  isNil(agent.published)
    ? null
    : { ...formValuesOf(agent), draft: agent.published };

const ScrollFade = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  const [scrolled, setScrolled] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  return (
    <div className={cn('relative', className)}>
      {scrolled && (
        <div className="pointer-events-none absolute left-0 right-0 top-0 z-[1] h-5 bg-gradient-to-b from-gray-1 to-transparent" />
      )}
      <div
        ref={bodyRef}
        onScroll={() => setScrolled((bodyRef.current?.scrollTop ?? 0) > 5)}
        className="h-full overflow-y-auto"
      >
        {children}
      </div>
    </div>
  );
};

const AgentConfigurePanel = ({
  agent,
  onExit,
}: {
  agent: Agent;
  onExit: () => void;
}) => {
  const form = useForm<ConfigureAgentInput, unknown, ConfigureAgentValues>({
    resolver: zodResolver(ConfigureAgentSchema),
    defaultValues: formValuesOf(agent),
    mode: 'onChange',
  });
  const updateAgent = agentsMutations.useUpdateAgent({ id: agent.id });

  const values = form.watch();
  const formNeedsModel =
    isNil(values.draft?.modelName) || isNil(values.draft?.provider);
  const live = liveValuesOf(agent);
  const hasChanges =
    isNil(live) || !agentEditState.sameConfig({ left: values, right: live });
  const unsavedTyping = form.formState.isDirty;
  const deletedRef = useRef(false);
  const leaveBlocker = useWarnBeforeLosingChanges({
    hasChanges: unsavedTyping,
    standDown: deletedRef,
  });
  const [exitRequested, setExitRequested] = useState(false);
  const leaveDecision = agentEditState.leaveGuard({
    blockerState: leaveBlocker.state,
    exitRequested,
  });
  const writeLock = useRef(agentEditState.createWriteLock());

  const lastFromServer = useRef(formValuesOf(agent));
  const [movedUnderneath, setMovedUnderneath] = useState(false);

  useEffect(() => {
    const fromServer = formValuesOf(agent);
    if (
      agentEditState.serverMovedWhileTyping({
        fromServer,
        lastSeen: lastFromServer.current,
        unsavedTyping,
      })
    ) {
      setMovedUnderneath(true);
      return;
    }
    if (
      agentEditState.sameConfig({
        left: fromServer,
        right: lastFromServer.current,
      })
    ) {
      return;
    }
    lastFromServer.current = fromServer;
    setMovedUnderneath(false);
    form.reset(fromServer);
  }, [agent, unsavedTyping, form]);

  const takeTheirVersion = () => {
    const fromServer = formValuesOf(agent);
    lastFromServer.current = fromServer;
    setMovedUnderneath(false);
    form.reset(fromServer);
  };

  const setServerError = (error: Error, fallback: string) =>
    form.setError('root.serverError', {
      type: 'manual',
      message: api.extractServerErrorMessage(error, fallback),
    });

  const markSavedUnlessEditedSince = (written: ConfigureAgentInput) => {
    if (
      !agentEditState.sameConfig({ left: form.getValues(), right: written })
    ) {
      return;
    }
    form.reset(written);
  };

  const releaseWrite = () => writeLock.current.release();
  const claimWrite = () => writeLock.current.claim();

  const handleSubmit = (values: ConfigureAgentValues) => {
    form.clearErrors('root.serverError');
    updateAgent.mutate(toUpdateRequest(values), {
      onSuccess: () => {
        markSavedUnlessEditedSince(values);
        toast(t('Live — every flow using this agent just got the update'));
      },
      onError: (error) =>
        setServerError(error, t("Your changes weren't saved. Try again.")),
      onSettled: releaseWrite,
    });
  };

  const saveAndGoLive = form.handleSubmit(handleSubmit, releaseWrite);
  const submitIfIdle = (event: React.FormEvent<HTMLFormElement>) => {
    if (movedUnderneath || !claimWrite()) {
      event.preventDefault();
      return;
    }
    void saveAndGoLive(event);
  };

  const requestExit = () => (unsavedTyping ? setExitRequested(true) : onExit());

  return (
    <Form {...form}>
      <LeaveWithoutSavingDialog
        open={leaveDecision.open}
        onKeepEditing={() => {
          setExitRequested(false);
          leaveBlocker.reset?.();
        }}
        onDiscard={() => {
          setExitRequested(false);
          if (leaveDecision.discardAction === 'proceed') {
            leaveBlocker.proceed?.();
            return;
          }
          onExit();
        }}
      />
      <form
        onSubmit={submitIfIdle}
        className="flex h-full min-h-0 w-full shrink-0 flex-col"
      >
        <Tabs
          defaultValue="behavior"
          className="flex min-h-0 grow flex-col gap-0"
        >
          <div className="flex h-12 shrink-0 items-center justify-between gap-3 border-b border-gray-6 px-4">
            <div className="flex min-w-0 items-center gap-2">
              <span className="truncate text-sm font-semibold">
                {t('Configure')}
              </span>
              {unsavedTyping && (
                <span className="flex shrink-0 items-center gap-1.5 text-xs text-gray-11 animate-in fade-in duration-200">
                  <Dot variant="primary" className="size-1.5" />
                  {t('Unsaved')}
                </span>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {movedUnderneath ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={takeTheirVersion}
                  className="shrink-0"
                >
                  {t('Changed in chat — reload')}
                </Button>
              ) : (
                hasChanges && (
                  <Button
                    type="submit"
                    size="sm"
                    loading={updateAgent.isPending}
                    className="shrink-0 animate-in fade-in duration-200"
                  >
                    {t('Publish')}
                  </Button>
                )
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t('Close')}
                onClick={requestExit}
                className="shrink-0 text-gray-11"
              >
                <X />
              </Button>
            </div>
          </div>
          <div className="flex shrink-0 items-center border-b border-gray-6 px-2">
            <TabsList variant="line">
              <TabsTrigger value="behavior" className="flex-none">
                {t('Behavior')}
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex-none">
                {t('Settings')}
              </TabsTrigger>
            </TabsList>
          </div>
          <ScrollFade className="min-h-0 grow">
            <div className="p-4">
              <TabsContent
                value="behavior"
                className="mt-0 flex flex-col gap-4"
              >
                <ConfigureBehaviorTab form={form} needsModel={formNeedsModel} />
              </TabsContent>
              <TabsContent
                value="settings"
                className="mt-0 flex flex-col gap-4"
              >
                <ConfigureSettingsTab
                  agent={agent}
                  form={form}
                  onDeleted={() => {
                    deletedRef.current = true;
                  }}
                />
              </TabsContent>
              {form.formState.errors.root?.serverError && (
                <p className="mt-4 text-xs text-danger-11">
                  {form.formState.errors.root.serverError.message}
                </p>
              )}
            </div>
          </ScrollFade>
        </Tabs>
      </form>
    </Form>
  );
};

export { AgentConfigurePanel };
