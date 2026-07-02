import { useQuery } from '@tanstack/react-query';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/lib/api';

import { HarnessSources } from './harness-utils';
import {
  GuidesPanel,
  PipelinePanel,
  ScorecardPanel,
  SystemPromptPanel,
  ToolsPanel,
} from './panels';

export const AgentHarnessPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['agent-harness-sources'],
    queryFn: () => api.get<HarnessSources>('/v1/chat/harness'),
    staleTime: Infinity,
    retry: false,
  });

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Agent Harness Console
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The authored knowledge and control surfaces that shape the chat
            agent — system prompt, on-demand guides, tools &amp; phases, the
            per-turn assembly pipeline, and a best-practices scorecard.{' '}
            <span className="text-muted-foreground/70">(dev only)</span>
          </p>
        </div>

        <Tabs defaultValue="system" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="system">System Prompt</TabsTrigger>
            <TabsTrigger value="guides">Guides</TabsTrigger>
            <TabsTrigger value="tools">Tools</TabsTrigger>
            <TabsTrigger value="pipeline">Assembly</TabsTrigger>
            <TabsTrigger value="scorecard">Scorecard</TabsTrigger>
          </TabsList>

          <TabsContent value="system">
            <SystemPromptPanel system={data?.system} isLoading={isLoading} />
          </TabsContent>
          <TabsContent value="guides">
            <GuidesPanel guides={data?.guides} isLoading={isLoading} />
          </TabsContent>
          <TabsContent value="tools">
            <ToolsPanel />
          </TabsContent>
          <TabsContent value="pipeline">
            <PipelinePanel sources={data} />
          </TabsContent>
          <TabsContent value="scorecard">
            <ScorecardPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
