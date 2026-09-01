import { isNil, Permission, unique } from '@activepieces/core-utils';
import {
  Agent,
  AgentConfig,
  ApFlagId,
  AgentIcon,
  AgentKnowledgeBaseTool,
  agentUtils,
  AgentToolType,
  ColorName,
  DEFAULT_AGENT_MAX_STEPS,
  MAX_AGENT_STEP_BUDGET,
  PROJECT_COLOR_PALETTE,
  UpdateAgentRequest,
  formErrors,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FlaskConical,
  Loader2,
  Pencil,
  Rocket,
  SearchX,
  Settings2,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  unstable_useBlocker,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

import { AgentTools } from '@/app/builder/step-settings/agent-settings/agent-tools';
import { LockedFeatureGuard } from '@/app/components/locked-feature-guard';
import { AIChatBox } from '@/app/routes/chat-with-ai/ai-chat-box';
import { ConversationList } from '@/app/routes/chat-with-ai/conversation-list';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/custom/empty';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
  KnowledgeBaseSection,
  AIModelSelector,
  AgentStructuredOutput,
  useAgentsAvailable,
} from '@/features/agents';
import { AgentChatWelcome } from '@/features/agents/agent-chat-welcome';
import { AgentMark } from '@/features/agents/agent-mark';
import { DeleteAgentDialog } from '@/features/agents/delete-agent-dialog';
import {
  agentsMutations,
  agentsQueries,
} from '@/features/agents/hooks/agents-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { flagsHooks } from '@/hooks/flags-hooks';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

import { agentEditState, HeaderStatus } from '../lib/agent-edit-state';
import { agentTestGate } from '../lib/agent-test-gate';

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

const pieceDisplayName = (pieceName: string): string =>
  pieceName.replace('@activepieces/piece-', '');

const buildCapabilityNote = (agent: Agent): string => {
  const toolNames = unique(
    agent.draft.tools.map((tool) =>
      tool.type === AgentToolType.PIECE
        ? pieceDisplayName(tool.pieceMetadata.pieceName)
        : tool.toolName,
    ),
  );
  if (toolNames.length === 0) {
    return t('{name} has no tools yet, so replies may need review', {
      name: agent.displayName,
    });
  }
  return t('{name} can use {tools} and replies may need review', {
    name: agent.displayName,
    tools: toolNames.join(', '),
  });
};

const CONVERSATION_QUERY_PARAM = 'conversation';

const HEADER_STATUS_COPY: Record<HeaderStatus, () => string> = {
  'needs-model': () => t('Needs a model to run'),
  live: () => t('Live'),
  pending: () => t('Changes not live yet'),
};

type AgentRequirement = {
  label: string;
  hint: string;
  met: boolean;
};

// A run reads the published configuration and only falls back to the draft, so readiness has to
// be judged on the same one. Otherwise clearing a published agent's draft would present a
// perfectly runnable agent as unfinished.
const requirementsFor = (agent: Agent): AgentRequirement[] => {
  const running = agent.published ?? agent.draft;
  return [
    {
      label: t('Instructions'),
      hint: t('What the agent should do, and how to decide.'),
      met: agentUtils.isPublishable(running),
    },
    {
      label: t('Model'),
      hint: t('The model that answers, and the provider behind it.'),
      met: !isNil(running.modelName) && !isNil(running.provider),
    },
  ];
};

const AgentEditorSkeleton = () => (
  <div className="flex h-full w-full flex-col">
    <div className="flex h-[76px] shrink-0 items-center gap-[14px] border-b border-border px-6">
      <Skeleton className="size-12 rounded-[14px]" />
      <Skeleton className="h-5 w-[220px]" />
    </div>
    <div className="flex grow items-center justify-center p-6">
      <Skeleton className="h-[360px] w-full max-w-[720px] rounded-[19px]" />
    </div>
  </div>
);

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
    <div className="mt-2 flex flex-col gap-3 rounded-lg border border-destructive/30 p-4">
      <div className="flex flex-col gap-1">
        <span className="text-[13px] font-semibold leading-4">
          {t('Delete this agent')}
        </span>
        <span className="text-[13px] leading-4 text-muted-foreground">
          {t(
            'Its instructions, its tools, and every conversation held with it go with it.',
          )}
        </span>
      </div>
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
          variant="destructive"
          className="w-fit gap-2"
          onClick={() => setDeleting(true)}
        >
          <Trash2 size={15} />
          {t('Delete')}
        </Button>
      </DeleteAgentDialog>
    </div>
  );
};

const AgentIdentityPopover = ({
  form,
  focus,
  children,
}: {
  form: ReturnType<
    typeof useForm<ConfigureAgentInput, unknown, ConfigureAgentValues>
  >;
  focus?: 'description';
  children: React.ReactNode;
}) => (
  <Popover>
    <PopoverTrigger asChild>{children}</PopoverTrigger>
    <PopoverContent
      align="start"
      className="w-[340px]"
      onOpenAutoFocus={(event) => {
        if (focus !== 'description') {
          return;
        }
        event.preventDefault();
        const field = event.currentTarget as HTMLElement | null;
        field
          ?.querySelector<HTMLTextAreaElement>('[name="description"]')
          ?.focus();
      }}
    >
      <div className="flex flex-col gap-4">
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-[9px]">
              <FormLabel showRequiredIndicator>{t('Name')}</FormLabel>
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
            <FormItem className="flex flex-col gap-[9px]">
              <FormLabel>{t('Description')}</FormLabel>
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
            <FormItem className="flex flex-col gap-[9px]">
              <FormLabel>{t('Shape')}</FormLabel>
              <div className="grid grid-cols-6 gap-2">
                {Object.values(AgentIcon).map((iconName) => (
                  <button
                    key={iconName}
                    type="button"
                    aria-label={iconName}
                    onClick={() => field.onChange(iconName)}
                    className={cn(
                      'flex items-center justify-center rounded-[10px] p-[3px]',
                      field.value === iconName && 'ring-2 ring-foreground',
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
            <FormItem className="flex flex-col gap-[9px]">
              <FormLabel>{t('Color')}</FormLabel>
              <div className="grid grid-cols-6 gap-2">
                {Object.values(ColorName).map((colorName) => (
                  <button
                    key={colorName}
                    type="button"
                    aria-label={colorName}
                    onClick={() => field.onChange(colorName)}
                    className={cn(
                      'flex items-center justify-center rounded-full p-[3px]',
                      field.value === colorName && 'ring-2 ring-foreground',
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
      </div>
    </PopoverContent>
  </Popover>
);

const ConfigureFields = ({
  agent,
  form,
  needsModel,
  onDeleted,
}: {
  agent: Agent;
  form: ReturnType<
    typeof useForm<ConfigureAgentInput, unknown, ConfigureAgentValues>
  >;
  needsModel: boolean;
  onDeleted: () => void;
}) => {
  const tools = form.watch('draft.tools') ?? [];
  const knowledgeCount = tools.filter(
    (tool) => tool.type === AgentToolType.KNOWLEDGE_BASE,
  ).length;
  const { data: knowledgeAvailable } = flagsHooks.useFlag<boolean>(
    ApFlagId.PGVECTOR_AVAILABLE,
  );
  const toolCount = unique(
    tools
      .filter((tool) => tool.type !== AgentToolType.KNOWLEDGE_BASE)
      .map((tool) =>
        tool.type === AgentToolType.PIECE
          ? tool.pieceMetadata?.pieceName ?? tool.toolName
          : tool.type,
      ),
  ).length;

  return (
    <>
      <FormField
        control={form.control}
        name="draft.instructions"
        render={({ field }) => (
          <FormItem className="flex flex-col gap-[9px]">
            <PanelSectionLabel label={t('Instructions')} required />
            <FormControl>
              <Textarea
                {...field}
                minRows={4}
                maxRows={12}
                placeholder={t(
                  'Reply to refund requests. Check the order in Stripe first, and escalate anything over $200.',
                )}
                className="rounded-[10px] px-[13px] py-3 text-[13px] leading-[155%]"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="draft.tools"
        render={({ field }) => (
          <FormItem className="flex flex-col gap-[9px]">
            <PanelSectionLabel
              label={t('Tools')}
              meta={
                toolCount > 0
                  ? t('toolsAddedCount', { count: toolCount })
                  : undefined
              }
            />
            <AgentTools
              layout="rows"
              toolsField={field}
              selectedProvider={form.watch('draft.provider') ?? undefined}
            />
            <FormMessage />
          </FormItem>
        )}
      />
      {knowledgeAvailable !== false && (
        <FormField
          control={form.control}
          name="draft.tools"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-[9px]">
              <PanelSectionLabel
                label={t('Knowledge')}
                meta={
                  knowledgeCount > 0
                    ? t('knowledgeSourcesCount', { count: knowledgeCount })
                    : undefined
                }
              />
              <KnowledgeBaseSection
                layout="rows"
                tools={tools.filter(
                  (tool): tool is AgentKnowledgeBaseTool =>
                    tool.type === AgentToolType.KNOWLEDGE_BASE,
                )}
                allTools={tools}
                removeTool={(toolName: string) =>
                  field.onChange(
                    tools.filter((tool) => tool.toolName !== toolName),
                  )
                }
                onToolsUpdate={field.onChange}
                selectedProvider={form.watch('draft.provider') ?? undefined}
              />
            </FormItem>
          )}
        />
      )}
      <FormItem className="flex flex-col gap-[9px]">
        <PanelSectionLabel label={t('Model')} />
        {needsModel && (
          <p className="text-[13px] leading-4 text-destructive">
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
      <AdvancedSection>
        <FormField
          control={form.control}
          name="draft.structuredOutput"
          render={({ field }) => (
            <FormItem className="flex flex-col gap-[9px]">
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
            <FormItem className="flex flex-col gap-[9px]">
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
        <AgentDangerZone agent={agent} onDeleted={onDeleted} />
      </AdvancedSection>
    </>
  );
};

const describeAgent = (description?: string | null): string =>
  isNil(description) || description.trim().length === 0
    ? t('Add a description')
    : description;

const PanelSectionLabel = ({
  label,
  meta,
  required,
}: {
  label: string;
  meta?: string;
  required?: boolean;
}) => (
  <div className="flex items-baseline gap-2">
    <FormLabel
      showRequiredIndicator={required}
      className="grow text-[13px] font-semibold"
    >
      {label}
    </FormLabel>
    {meta !== undefined && (
      <span className="text-xs leading-4 text-muted-foreground">{meta}</span>
    )}
  </div>
);

const AdvancedSection = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-[9px] border-t border-border pt-4">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-fit items-center gap-1.5 text-[13px] font-semibold leading-4 text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronRight
          size={14}
          className={cn('transition-transform', open && 'rotate-90')}
        />
        {t('Advanced')}
      </button>
      {open && <div className="flex flex-col gap-[20px]">{children}</div>}
    </div>
  );
};

const useWarnBeforeLosingChanges = ({
  hasChanges,
  standDown,
}: {
  hasChanges: boolean;
  standDown: React.RefObject<boolean>;
}) => {
  const blocker = unstable_useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasChanges &&
      standDown.current !== true &&
      currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (!hasChanges) return;
    const warn = (event: BeforeUnloadEvent) => {
      if (standDown.current === true) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasChanges]);

  return blocker;
};

const LeaveWithoutSavingDialog = ({
  open,
  onKeepEditing,
  onDiscard,
}: {
  open: boolean;
  onKeepEditing: () => void;
  onDiscard: () => void;
}) => (
  <Dialog
    open={open}
    onOpenChange={(next) => {
      if (!next) onKeepEditing();
    }}
  >
    <DialogContent className="max-w-[420px]">
      <DialogHeader>
        <DialogTitle>{t('Leave without saving?')}</DialogTitle>
        <DialogDescription>
          {t(
            'These edits have not gone live yet. Leave now and they are discarded.',
          )}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={onKeepEditing}>
          {t('Keep editing')}
        </Button>
        <Button variant="destructive" onClick={onDiscard}>
          {t('Discard changes')}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
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

const AgentEditScreen = ({
  agent,
  onExit,
  onEdited,
}: {
  agent: Agent;
  onExit: () => void;
  onEdited: () => void;
}) => {
  const [mode, setMode] = useState('edit');
  const form = useForm<ConfigureAgentInput, unknown, ConfigureAgentValues>({
    resolver: zodResolver(ConfigureAgentSchema),
    defaultValues: formValuesOf(agent),
    mode: 'onChange',
  });
  const updateAgent = agentsMutations.useUpdateAgent({ id: agent.id });
  const stageDraft = agentsMutations.useUpdateAgent({ id: agent.id });
  const [justLaunched, setJustLaunched] = useState(false);
  const [testConversationId, setTestConversationId] = useState<string | null>(
    null,
  );

  const values = form.watch();
  const formNeedsModel =
    isNil(values.draft?.modelName) || isNil(values.draft?.provider);
  const testGate = agentTestGate.blockedReason({ draft: values.draft });
  const blockedFromTesting = isNil(testGate)
    ? null
    : testGate === 'model'
    ? t('Pick a model before testing')
    : t('Write instructions before testing');
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
  const testRequested = useRef(false);
  const writeSeq = useRef(0);
  const writeLock = useRef(agentEditState.createWriteLock());

  const lastFromServer = useRef(formValuesOf(agent));

  useEffect(() => {
    const fromServer = formValuesOf(agent);
    if (
      agentEditState.sameConfig({
        left: fromServer,
        right: lastFromServer.current,
      })
    ) {
      return;
    }
    if (unsavedTyping) return;
    lastFromServer.current = fromServer;
    form.reset(fromServer);
  }, [agent, unsavedTyping, form]);

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

  const openTestWithLatestEdits = form.handleSubmit((values) => {
    const seq = ++writeSeq.current;
    return stageDraft.mutate(
      { ...toUpdateRequest(values), goLive: false },
      {
        onSuccess: () => {
          if (seq !== writeSeq.current) return;
          markSavedUnlessEditedSince(values);
          if (testRequested.current) setMode('test');
        },
        onError: (error) =>
          setServerError(
            error,
            t("Your changes couldn't be staged for testing. Try again."),
          ),
        onSettled: releaseWrite,
      },
    );
  }, releaseWrite);

  const changeMode = (next: string) => {
    testRequested.current = next === 'test';
    const intent = agentEditState.modeIntent({
      next,
      unsavedTyping,
      blockedReason: blockedFromTesting,
    });
    if (intent === 'switch') {
      setMode(next);
      return;
    }
    if (!claimWrite()) return;
    void openTestWithLatestEdits();
  };

  const handleSubmit = (values: ConfigureAgentValues) => {
    form.clearErrors('root.serverError');
    const seq = ++writeSeq.current;
    updateAgent.mutate(toUpdateRequest(values), {
      onSuccess: () => {
        if (seq !== writeSeq.current) return;
        markSavedUnlessEditedSince(values);
        setJustLaunched(true);
        window.setTimeout(() => setJustLaunched(false), 1600);
        toast(t('Live — every flow using this agent just got the update'));
      },
      onError: (error) =>
        setServerError(error, t("Your changes weren't saved. Try again.")),
      onSettled: releaseWrite,
    });
  };

  const saveAndGoLive = form.handleSubmit(handleSubmit, releaseWrite);
  const submitIfIdle = (event: React.FormEvent<HTMLFormElement>) => {
    if (!claimWrite()) {
      event.preventDefault();
      return;
    }
    void saveAndGoLive(event);
  };

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
        className="flex h-full w-full min-h-0 flex-col"
      >
        <div className="flex h-[76px] shrink-0 items-center gap-[14px] border-b border-border px-6">
          <button
            type="button"
            aria-label={t('Back to the agent')}
            onClick={() => (unsavedTyping ? setExitRequested(true) : onExit())}
            className="flex size-[34px] shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ChevronLeft size={16} />
          </button>
          <AgentIdentityPopover form={form}>
            <button
              type="button"
              aria-label={t('Edit name and appearance')}
              className="group relative shrink-0 rounded-[14px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <AgentMark
                icon={form.watch('icon')}
                color={form.watch('color')}
              />
              <span className="absolute -bottom-[3px] -end-[3px] flex size-[19px] items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-colors group-hover:border-foreground/30 group-hover:bg-accent group-hover:text-foreground">
                <Pencil size={11} strokeWidth={2.2} />
              </span>
            </button>
          </AgentIdentityPopover>
          <div className="flex min-w-0 grow basis-0 flex-col gap-[2px]">
            <AgentIdentityPopover form={form}>
              <button
                type="button"
                aria-label={t('Edit name and appearance')}
                className="min-w-0 truncate rounded-md text-start text-[17px] font-semibold leading-[22px] tracking-[-0.01em] outline-none hover:text-foreground/80 focus-visible:ring-2 focus-visible:ring-ring"
              >
                {form.watch('displayName')}
              </button>
            </AgentIdentityPopover>
            <span className="flex min-w-0 items-center gap-2 text-[13px] leading-4 text-muted-foreground">
              <span className="truncate">
                {HEADER_STATUS_COPY[
                  agentEditState.headerStatus({
                    needsModel: formNeedsModel,
                    justLaunched,
                    live,
                    hasChanges,
                  })
                ]()}
              </span>
              <span aria-hidden className="shrink-0 text-border">
                &middot;
              </span>
              <AgentIdentityPopover form={form} focus="description">
                <button
                  type="button"
                  aria-label={t('Edit the description')}
                  className="min-w-0 truncate rounded text-start outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {describeAgent(form.watch('description'))}
                </button>
              </AgentIdentityPopover>
            </span>
          </div>
          <Button
            type="submit"
            loading={updateAgent.isPending}
            disabled={!hasChanges || stageDraft.isPending}
            className="h-[38px] shrink-0 gap-2 overflow-hidden rounded-lg px-[18px]"
          >
            <motion.span
              className="flex items-center"
              animate={
                justLaunched
                  ? { x: 26, y: -26, rotate: 12, opacity: 0 }
                  : { x: 0, y: 0, rotate: 0, opacity: 1 }
              }
              transition={
                justLaunched
                  ? { duration: 0.5, ease: 'easeOut' }
                  : { duration: 0.2, delay: 0.35 }
              }
            >
              <Rocket size={15} />
            </motion.span>
            {justLaunched ? t('Live') : t('Save and go live')}
          </Button>
        </div>

        <div className="flex min-h-0 grow">
          <div className="flex min-w-0 grow basis-0 flex-col border-r border-border">
            <div className="flex h-[52px] shrink-0 items-stretch gap-4 border-b border-border px-[18px]">
              <Tabs
                value={mode}
                onValueChange={changeMode}
                className="flex h-full shrink-0 items-stretch"
              >
                <TabsList
                  variant="outline"
                  className="h-full items-stretch gap-[22px]"
                >
                  <TabsTrigger
                    value="edit"
                    variant="outline"
                    className="h-full items-center gap-2 text-[13px]"
                  >
                    <Sparkles size={14} />
                    {t('Edit with AI')}
                  </TabsTrigger>
                  <TabsTrigger
                    value="test"
                    variant="outline"
                    className="h-full items-center gap-2 text-[13px]"
                    disabled={stageDraft.isPending || updateAgent.isPending}
                  >
                    {stageDraft.isPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <FlaskConical size={14} />
                    )}
                    {t('Test')}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            {mode === 'test' ? (
              <TestPane
                agent={agent}
                blockedReason={blockedFromTesting}
                conversationId={testConversationId}
                onConversationCreated={setTestConversationId}
                onEdited={onEdited}
              />
            ) : (
              <EditWithAIPane agent={agent} onEdited={onEdited} />
            )}
          </div>

          <div className="flex w-[452px] shrink-0 flex-col">
            <div className="flex h-[52px] shrink-0 items-center justify-between border-b border-border px-[18px]">
              <span className="text-[13px] font-semibold leading-4">
                {t('Configure')}
              </span>
              {formNeedsModel && (
                <span className="flex items-center gap-1.5 text-xs leading-4 text-destructive">
                  <span className="size-[6px] rounded-full bg-destructive" />
                  {t('Needs a model')}
                </span>
              )}
            </div>
            <ScrollArea className="min-h-0 grow">
              <div className="flex flex-col gap-5 p-[18px]">
                <ConfigureFields
                  agent={agent}
                  form={form}
                  needsModel={formNeedsModel}
                  onDeleted={() => {
                    deletedRef.current = true;
                  }}
                />
                {form.formState.errors.root?.serverError && (
                  <p className="text-[13px] leading-4 text-destructive">
                    {form.formState.errors.root.serverError.message}
                  </p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </form>
    </Form>
  );
};

const AgentBuilderWelcome = () => (
  <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
    <Sparkles size={22} className="text-primary" />
    <span className="text-base font-semibold">{t('Describe a change')}</span>
    <span className="max-w-[320px] text-[13px] leading-5 text-muted-foreground">
      {t('Try “Only reply to paying customers” or “Add Slack and Notion”.')}
    </span>
  </div>
);

const TestPane = ({
  agent,
  blockedReason,
  conversationId,
  onConversationCreated,
  onEdited,
}: {
  agent: Agent;
  blockedReason: string | null;
  conversationId: string | null;
  onConversationCreated: (id: string) => void;
  onEdited: () => void;
}) =>
  !isNil(blockedReason) ? (
    <div className="flex min-h-0 grow flex-col items-center justify-center px-6 text-center">
      <span className="text-[13px] font-semibold leading-4">
        {blockedReason}
      </span>
    </div>
  ) : (
    <div className="flex min-h-0 grow flex-col">
      <AIChatBox
        incognito={false}
        agentId={agent.id}
        conversationId={conversationId}
        onConversationCreated={onConversationCreated}
        onTurnEnd={onEdited}
        placeholder={t('Try {name}...', { name: agent.displayName })}
        footerNote={buildCapabilityNote(agent)}
        emptyState={<AgentTestWelcome />}
      />
    </div>
  );

const AgentTestWelcome = () => (
  <div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
    <FlaskConical size={22} className="text-primary" />
    <span className="text-base font-semibold">
      {t('Try it before it goes live')}
    </span>
    <span className="max-w-[320px] text-[13px] leading-5 text-muted-foreground">
      {t('Give it a real task. It runs on the settings beside you.')}
    </span>
  </div>
);

const EditWithAIPane = ({
  agent,
  onEdited,
}: {
  agent: Agent;
  onEdited: () => void;
}) => (
  <div className="flex min-h-0 grow flex-col">
    <AIChatBox
      incognito={false}
      agentId={agent.id}
      builder
      onTurnEnd={onEdited}
      placeholder={t('Message the builder...')}
      emptyState={<AgentBuilderWelcome />}
    />
  </div>
);

const AgentEditorContent = () => {
  const navigate = useNavigate();
  const { agentId } = useParams<{ agentId: string }>();
  const queryClient = useQueryClient();
  const agentsAvailable = useAgentsAvailable();
  const [editing, setEditing] = useState<boolean>();
  const [conversationsOpen, setConversationsOpen] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const conversationId =
    searchParams.get(CONVERSATION_QUERY_PARAM) ?? undefined;
  const [openedConversationId, setOpenedConversationId] =
    useState(conversationId);
  const [freshConversations, setFreshConversations] = useState(0);

  const writeConversationParam = (nextConversationId: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (nextConversationId === null) {
      next.delete(CONVERSATION_QUERY_PARAM);
    } else {
      next.set(CONVERSATION_QUERY_PARAM, nextConversationId);
    }
    setSearchParams(next, { replace: true });
  };
  const openConversation = (nextConversationId: string) => {
    setOpenedConversationId(nextConversationId);
    writeConversationParam(nextConversationId);
  };
  const startNewConversation = () => {
    setOpenedConversationId(undefined);
    setFreshConversations((count) => count + 1);
    writeConversationParam(null);
  };
  const {
    data: agent,
    isLoading,
    isError,
  } = agentsQueries.useAgent({
    id: agentId ?? '',
    enabled: agentId !== undefined && agentsAvailable,
  });

  if (isLoading) {
    return <AgentEditorSkeleton />;
  }

  if (agent === undefined) {
    return (
      <Empty className="h-full">
        <EmptyHeader className="max-w-md">
          <EmptyMedia variant="icon">
            <SearchX />
          </EmptyMedia>
          <EmptyTitle>
            {isError
              ? t('That agent could not be loaded')
              : t('That agent is gone')}
          </EmptyTitle>
          <EmptyDescription>
            {isError
              ? t('It may have been deleted, or the connection dropped.')
              : t('It may have been deleted by someone else on the project.')}
          </EmptyDescription>
        </EmptyHeader>
        <Button variant="outline" onClick={() => navigate('/agents')}>
          {t('Back to agents')}
        </Button>
      </Empty>
    );
  }

  const requirements = requirementsFor(agent);
  const needsModel = requirements.some((requirement) => !requirement.met);
  const isEditing = editing ?? needsModel;
  const refetchAgent = () =>
    queryClient.invalidateQueries({ queryKey: ['agents', 'one', agent.id] });

  if (isEditing) {
    return (
      <AgentEditScreen
        key={agent.id}
        agent={agent}
        onExit={() => setEditing(false)}
        onEdited={refetchAgent}
      />
    );
  }

  return (
    <div className="flex h-full w-full">
      <aside
        className={cn(
          'shrink-0 overflow-hidden border-r border-border transition-[width] duration-200 ease-out',
          conversationsOpen ? 'w-[220px]' : 'w-0',
        )}
      >
        <div className="flex h-full w-[220px] flex-col">
          <ConversationList
            agentId={agent.id}
            selectedId={openedConversationId ?? conversationId ?? null}
            onSelect={openConversation}
            onNewChat={startNewConversation}
          />
        </div>
      </aside>
      <div className="flex min-w-0 grow flex-col">
        <div className="flex h-[76px] shrink-0 items-center gap-[14px] border-b border-border px-6">
          <button
            type="button"
            aria-label={
              conversationsOpen
                ? t('Collapse conversations')
                : t('Expand conversations')
            }
            onClick={() => setConversationsOpen(!conversationsOpen)}
            className="flex size-[34px] shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {conversationsOpen ? (
              <ChevronsLeft size={16} />
            ) : (
              <ChevronsRight size={16} />
            )}
          </button>
          <AgentMark icon={agent.icon} color={agent.color} />
          <div className="flex min-w-0 grow basis-0 flex-col gap-[2px]">
            <span className="truncate text-[17px] leading-[22px] font-semibold tracking-[-0.01em]">
              {agent.displayName}
            </span>
            <span className="truncate text-[13px] leading-4 text-muted-foreground">
              {agent.description ?? t('No description yet')}
            </span>
          </div>
          <div className="flex min-w-0 shrink items-center gap-2">
            {agent.draft.modelName && (
              <span className="flex h-[34px] max-w-[220px] items-center gap-[7px] overflow-hidden rounded-lg border border-border bg-background px-[11px] text-[13px] leading-4">
                <span
                  className="size-[11px] shrink-0 rounded-[3px]"
                  style={{
                    backgroundColor: PROJECT_COLOR_PALETTE[agent.color].color,
                  }}
                />
                <span className="truncate">{agent.draft.modelName}</span>
              </span>
            )}
            <Button
              type="button"
              variant="outline"
              className="h-[34px] shrink-0 gap-2 rounded-lg px-[13px]"
              onClick={() => setEditing(true)}
            >
              <Settings2 size={15} />
              {t('Configure')}
            </Button>
          </div>
        </div>

        <div className="flex min-h-0 grow flex-col">
          <AIChatBox
            key={openedConversationId ?? `new-${freshConversations}`}
            incognito={false}
            agentId={agent.id}
            conversationId={openedConversationId ?? null}
            onConversationCreated={writeConversationParam}
            placeholder={t('Ask {name}...', { name: agent.displayName })}
            footerNote={buildCapabilityNote(agent)}
            emptyState={
              <AgentChatWelcome
                displayName={agent.displayName}
                description={agent.description ?? null}
                icon={agent.icon}
                color={agent.color}
              />
            }
          />
        </div>
      </div>
    </div>
  );
};

const AgentEditorPage = () => {
  const agentsAvailable = useAgentsAvailable();
  return (
    <LockedFeatureGuard
      locked={!agentsAvailable}
      lockTitle={t('Unlock Agents')}
      lockDescription={t('Build an agent once, then use it in any flow.')}
      featureKey="AGENTS"
    >
      <AgentEditorContent />
    </LockedFeatureGuard>
  );
};

export { AgentEditorPage, AgentEditScreen, LeaveWithoutSavingDialog, TestPane };
