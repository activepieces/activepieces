import { isNil, apId } from '@activepieces/core-utils';
import {
  PopulatedFlow,
  FlowVersionState,
  FlowStatus,
  FlowOperationStatus,
  TemplateType,
  Template,
} from '@activepieces/shared';
import { ReactFlowProvider } from '@xyflow/react';
import { t } from 'i18next';
import { ArrowRight, Link, ExternalLink } from 'lucide-react';
import { useMemo, useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { FlowCanvas } from '@/app/builder/flow-canvas';
import { CanvasControls } from '@/app/builder/flow-canvas/canvas-controls';
import { BuilderStateProvider } from '@/app/builder/state/builder-state-provider';
import { Page, PageHeader, PageSection } from '@/components/custom/page';
import { TagWithBright } from '@/components/custom/tag-with-bright';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UseTemplateDialog } from '@/features/templates/components/use-template-dialog';
import { authenticationSession } from '@/lib/authentication-session';
import { formatUtils } from '@/lib/format-utils';
import { FROM_QUERY_PARAM } from '@/lib/navigation-utils';

import { FlowCard } from './flow-card';
import { PieceCard } from './piece-card';

type TemplateDetailsPageProps = {
  template: Template;
};

const TemplateDetailsPage = ({ template }: TemplateDetailsPageProps) => {
  const token = authenticationSession.getToken();
  const location = useLocation();
  const navigate = useNavigate();
  const [hasCanvasBeenInitialised, setHasCanvasBeenInitialised] =
    useState(false);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFlowIndex, setSelectedFlowIndex] = useState(0);
  const [renderKey, setRenderKey] = useState(0);
  const isNotAuthenticated = isNil(token);

  const mockFlow = useMemo<PopulatedFlow | null>(() => {
    if (!template || !template.flows || template.flows.length === 0) {
      return null;
    }

    const selectedFlow = template.flows[selectedFlowIndex];
    if (!selectedFlow) {
      return null;
    }

    const flowId = apId();
    return {
      id: flowId,
      projectId: apId(),
      externalId: apId(),
      folderId: null,
      status: FlowStatus.DISABLED,
      publishedVersionId: null,
      metadata: null,
      operationStatus: FlowOperationStatus.NONE,
      created: template.created,
      updated: template.updated,
      version: {
        ...selectedFlow,
        id: apId(),
        flowId: flowId,
        created: template.created,
        updated: template.updated,
        state: FlowVersionState.LOCKED,
        updatedBy: null,
        agentIds: [],
        connectionIds: [],
        notes: selectedFlow.notes ?? [],
      },
    };
  }, [template, selectedFlowIndex]);

  useEffect(() => {
    setHasCanvasBeenInitialised(false);
    const timer = setTimeout(() => {
      setRenderKey((prev) => prev + 1);
    }, 50);
    return () => clearTimeout(timer);
  }, [selectedFlowIndex]);

  const handleUseTemplate = () => {
    if (isNil(token)) {
      navigate(
        `/sign-in?${FROM_QUERY_PARAM}=${location.pathname}${location.search}`,
      );
      return;
    }
    setIsDialogOpen(true);
  };

  const handleUseWithGuide = () => {
    if (template.blogUrl) {
      const url =
        template.blogUrl.startsWith('http://') ||
        template.blogUrl.startsWith('https://')
          ? template.blogUrl
          : `https://${template.blogUrl}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/templates/${template.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t('Link copied to clipboard!'));
    } catch (error) {
      toast.error(t('Failed to copy link'));
    }
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden absolute inset-0">
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
        <div className="grid h-full w-full grid-cols-1 overflow-hidden lg:grid-cols-[2fr_3fr]">
          <ScrollArea className="h-full w-full">
            <Page>
              <PageHeader
                title={template.name}
                back={
                  template.type !== TemplateType.SHARED
                    ? { to: '/templates', label: t('All Templates') }
                    : undefined
                }
              >
                {template.type !== TemplateType.SHARED && (
                  <Button variant="outline" onClick={handleShare}>
                    <Link />
                    {t('Share')}
                  </Button>
                )}
              </PageHeader>

              {!isNil(template.tags) && template.tags.length > 0 && (
                <div className="flex min-w-0 flex-wrap gap-2">
                  {template.tags.map((tag, index) => (
                    <TagWithBright
                      index={index}
                      key={index}
                      prefix={t('Save')}
                      title={tag.title}
                      color={tag.color}
                      size="sm"
                    />
                  ))}
                </div>
              )}

              <div className="flex min-w-0 gap-2">
                <Button onClick={handleUseTemplate} className="flex-1">
                  {t('Use Template')}
                  <ArrowRight />
                </Button>
                {template.type !== TemplateType.SHARED && (
                  <Button
                    variant="outline"
                    onClick={handleUseWithGuide}
                    className="flex-1"
                  >
                    {t('Setup guide')}
                    <ExternalLink />
                  </Button>
                )}
              </div>

              <PageSection title={t('About this template')}>
                <p className="text-sm text-gray-11">{template.description}</p>
              </PageSection>

              {template.flows && (
                <PageSection title={t("What's included?")}>
                  <div className="flex flex-col gap-2">
                    {template.flows.map((flow, index) => (
                      <FlowCard
                        key={index}
                        flow={flow}
                        isSelected={selectedFlowIndex === index}
                        singleFlow={
                          !(
                            template &&
                            template.flows &&
                            template.flows.length > 1
                          )
                        }
                        onClick={() => setSelectedFlowIndex(index)}
                      />
                    ))}
                  </div>
                </PageSection>
              )}

              <PageSection title={t('Used Pieces')}>
                <div className="flex flex-wrap gap-2">
                  {template.pieces.map((pieceName: string, index: number) => (
                    <PieceCard key={index} pieceName={pieceName} />
                  ))}
                </div>
              </PageSection>

              <div className="mt-4 flex items-center gap-1 text-xs text-gray-11">
                <span>{t('By')}</span>
                <span className="font-medium text-gray-12">
                  {template.author}
                </span>
                <span>•</span>
                <span>
                  {formatUtils.formatDate(new Date(template.created))}
                </span>
              </div>
            </Page>
          </ScrollArea>

          <div
            ref={canvasContainerRef}
            className="relative h-full w-full overflow-hidden border-l bg-gray-2"
          >
            {mockFlow && renderKey > 0 ? (
              <div key={renderKey} className="h-full w-full">
                <ReactFlowProvider>
                  <BuilderStateProvider
                    flow={mockFlow}
                    flowVersion={mockFlow.version}
                    readonly={true}
                    hideTestWidget={true}
                    run={null}
                    outputSampleData={{}}
                    inputSampleData={{}}
                  >
                    <FlowCanvas
                      setHasCanvasBeenInitialised={setHasCanvasBeenInitialised}
                    />
                    {canvasContainerRef.current && hasCanvasBeenInitialised && (
                      <CanvasControls
                        canvasHeight={canvasContainerRef.current.clientHeight}
                        canvasWidth={canvasContainerRef.current.clientWidth}
                        hasCanvasBeenInitialised={hasCanvasBeenInitialised}
                        selectedStep={null}
                      />
                    )}
                  </BuilderStateProvider>
                </ReactFlowProvider>
              </div>
            ) : mockFlow ? (
              <div className="text-gray-11 text-sm flex items-center justify-center h-full" />
            ) : (
              <div className="text-gray-11 text-sm flex items-center justify-center h-full">
                {t('No flow preview available')}
              </div>
            )}
          </div>
        </div>
      </div>
      {!isNotAuthenticated && (
        <UseTemplateDialog
          template={template}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />
      )}
    </div>
  );
};

export { TemplateDetailsPage };
