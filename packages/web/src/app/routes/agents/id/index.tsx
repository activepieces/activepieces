import {
  AgentConfig,
  AgentIcon,
  ColorName,
  DEFAULT_AGENT_MAX_STEPS,
  MAX_AGENT_STEP_BUDGET,
  UpdateAgentRequest,
  formErrors,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { t } from 'i18next';
import { ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';

import { AgentTools } from '@/app/builder/step-settings/agent-settings/agent-tools';
import { AIChatBox } from '@/app/routes/chat-with-ai/ai-chat-box';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { AIModelSelector, AgentStructuredOutput } from '@/features/agents';
import { AgentMark } from '@/features/agents/agent-mark';
import {
  agentsMutations,
  agentsQueries,
} from '@/features/agents/hooks/agents-hooks';
import { authenticationSession } from '@/lib/authentication-session';

const EditAgentFormSchema = z.object({
  displayName: z.string().min(1, formErrors.required),
  description: z.string(),
  draft: AgentConfig,
});

type EditAgentFormInput = z.input<typeof EditAgentFormSchema>;
type EditAgentFormValues = z.output<typeof EditAgentFormSchema>;

const toUpdateRequest = (values: EditAgentFormValues): UpdateAgentRequest => ({
  displayName: values.displayName,
  description: values.description.length > 0 ? values.description : null,
  draft: values.draft,
});

const parseProvider = (provider?: string) => {
  const parsed = AgentConfig.shape.provider.safeParse(provider ?? null);
  return parsed.success ? parsed.data : null;
};

const AgentEditorSkeleton = () => (
  <div className="flex w-full flex-col gap-5 px-12 pt-8 pb-12">
    <Skeleton className="h-12 w-[280px] rounded-[14px]" />
    <Skeleton className="h-[420px] w-full rounded-[19px]" />
  </div>
);

const AgentEditorForm = ({
  agentId,
  icon,
  color,
  defaults,
  isPublished,
}: {
  agentId: string;
  icon: AgentIcon;
  color: ColorName;
  defaults: EditAgentFormInput;
  isPublished: boolean;
}) => {
  const navigate = useNavigate();
  const form = useForm<EditAgentFormInput, unknown, EditAgentFormValues>({
    resolver: zodResolver(EditAgentFormSchema),
    defaultValues: defaults,
    mode: 'onChange',
  });
  const updateAgent = agentsMutations.useUpdateAgent({ id: agentId });
  const publishAgent = agentsMutations.usePublishAgent({ id: agentId });
  const unpublishAgent = agentsMutations.useUnpublishAgent({ id: agentId });

  const handleSubmit = (values: EditAgentFormValues) => {
    form.clearErrors('root.serverError');
    updateAgent.mutate(toUpdateRequest(values), {
      onError: () =>
        form.setError('root.serverError', {
          type: 'manual',
          message: t('Could not save the agent. Try again.'),
        }),
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="flex w-full flex-col gap-6 px-12 pt-8 pb-12"
      >
        <div className="flex items-center gap-[14px]">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t('Back')}
            onClick={() =>
              navigate(
                authenticationSession.appendProjectRoutePrefix('/agents'),
              )
            }
          >
            <ArrowLeft size={16} />
          </Button>
          <AgentMark icon={icon} color={color} />
          <div className="flex min-w-0 grow basis-0 flex-col gap-[3px]">
            <span className="truncate text-xl leading-6 font-semibold tracking-[-0.01em]">
              {form.watch('displayName')}
            </span>
            <span className="text-[13px] leading-4 text-muted-foreground">
              {isPublished ? t('Published') : t('Draft only')}
            </span>
          </div>
          {isPublished && (
            <Button
              type="button"
              variant="outline"
              loading={unpublishAgent.isPending}
              onClick={() => unpublishAgent.mutate()}
            >
              {t('Unpublish')}
            </Button>
          )}
          <Button
            type="button"
            variant="outline"
            loading={publishAgent.isPending}
            onClick={() => publishAgent.mutate()}
          >
            {t('Publish')}
          </Button>
          <Button type="submit" loading={updateAgent.isPending}>
            {t('Save')}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex flex-col gap-5 rounded-[19px] border border-border bg-background p-5 shadow-[0_1px_2px_#0A0A0A08]">
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem>
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
                <FormItem>
                  <FormLabel>{t('Description')}</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="draft.instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel showRequiredIndicator>
                    {t('Instructions')}
                  </FormLabel>
                  <FormControl>
                    <Textarea {...field} minRows={6} maxRows={20} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormItem>
              <AIModelSelector
                defaultProvider={form.watch('draft.provider') ?? undefined}
                defaultModel={form.watch('draft.modelName') ?? undefined}
                onChange={({ provider, model }) => {
                  form.setValue('draft.provider', parseProvider(provider), {
                    shouldDirty: true,
                  });
                  form.setValue('draft.modelName', model ?? null, {
                    shouldDirty: true,
                  });
                }}
              />
            </FormItem>
            <FormField
              control={form.control}
              name="draft.tools"
              render={({ field }) => (
                <FormItem>
                  <AgentTools
                    toolsField={field}
                    selectedProvider={form.watch('draft.provider') ?? undefined}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="draft.structuredOutput"
              render={({ field }) => (
                <FormItem>
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
                <FormItem>
                  <FormLabel>{t('Max steps')}</FormLabel>
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
            {form.formState.errors.root?.serverError && (
              <p className="text-sm text-destructive">
                {form.formState.errors.root.serverError.message}
              </p>
            )}
          </div>

          <div className="flex min-h-[560px] flex-col overflow-clip rounded-[19px] border border-border bg-background shadow-[0_1px_2px_#0A0A0A08]">
            <div className="flex items-center gap-2 border-b border-border px-5 py-3">
              <p className="text-sm font-semibold">{t('Try this agent')}</p>
              <span className="text-[13px] leading-4 text-muted-foreground">
                {isPublished
                  ? t('Running the published version')
                  : t('Running the draft')}
              </span>
            </div>
            <div className="flex min-h-0 grow flex-col">
              <AIChatBox incognito={false} agentId={agentId} />
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
};

const AgentEditorPage = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const { data: agent, isLoading } = agentsQueries.useAgent({
    id: agentId ?? '',
    enabled: agentId !== undefined,
  });

  if (isLoading || agent === undefined) {
    return <AgentEditorSkeleton />;
  }

  return (
    <AgentEditorForm
      agentId={agent.id}
      icon={agent.icon}
      color={agent.color}
      isPublished={agent.published !== null}
      defaults={{
        displayName: agent.displayName,
        description: agent.description ?? '',
        draft: agent.draft,
      }}
    />
  );
};

export { AgentEditorPage };
