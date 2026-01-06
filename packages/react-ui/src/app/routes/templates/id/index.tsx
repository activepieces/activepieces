import { ReactFlowProvider } from '@xyflow/react';
import { t } from 'i18next';
import { ArrowLeft, ArrowRight, Link, ExternalLink } from 'lucide-react';
import { useMemo, useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { FlowCanvas } from '@/app/builder/flow-canvas';
import { CanvasControls } from '@/app/builder/flow-canvas/canvas-controls';
import { BuilderStateProvider } from '@/app/builder/state/builder-state-provider';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar-shadcn';
import { TagWithBright } from '@/components/ui/tag-with-bright';
import { authenticationSession } from '@/lib/authentication-session';
import { FROM_QUERY_PARAM } from '@/lib/navigation-utils';
import { formatUtils } from '@/lib/utils';
import {
  isNil,
  PopulatedFlow,
  FlowVersionState,
  apId,
  FlowStatus,
  FlowOperationStatus,
  TemplateType,
  Template,
} from '@activepieces/shared';

import { FlowCard } from './flow-card';
import { PieceCard } from './piece-card';
import { UseTemplateDialog } from './use-template-dialog';

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
  const { setOpen } = useSidebar();
  const hasClosedSidebar = useRef(false);
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
      },
    };
  }, [template, selectedFlowIndex]);

  useEffect(() => {
    if (!hasClosedSidebar.current) {
      setOpen(false);
      hasClosedSidebar.current = true;
    }
  }, [setOpen]);

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
      {template.type !== TemplateType.SHARED && (
        <div className="border-b py-4 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-5" />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/templates')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-semibold whitespace-nowrap">
                {t('All Templates')}
              </span>
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Link className="w-4 h-4" />
            {t('Share')}
          </Button>
        </div>
      )}
      <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] h-full w-full overflow-hidden">
          <ScrollArea className="h-full w-full">
            <div className="flex flex-col gap-4 px-6 mt-6 min-w-0">
              <span className="text-2xl font-bold">{template.name}</span>

              {!isNil(template.tags) && template.tags.length > 0 && (
                <div className="flex gap-2 flex-wrap min-w-0">
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

              <div className="flex flex-col gap-8 min-w-0">
                <div className="flex flex-row justify-center gap-3 min-w-0">
                  <Button
                    onClick={handleUseTemplate}
                    size="xl"
                    className="flex-1"
                  >
                    {t('Use Template')}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  {template.type !== TemplateType.SHARED && (
                    <Button
                      variant="outline"
                      onClick={handleUseWithGuide}
                      size="xl"
                      className="flex-1"
                    >
                      {t('Setup guide')}
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-sm font-semibold">
                    {t('About this template')}
                  </span>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {template.description}
                  </p>
                </div>

                {template.flows && (
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-semibold">
                      {t("What's included?")}
                    </span>

                    <div className="grid grid-cols-1 gap-3">
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
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <span className="text-sm font-semibold">
                    {t('Used Pieces')}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {template.pieces.map((pieceName: string, index: number) => (
                      <PieceCard key={index} pieceName={pieceName} />
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-1 text-xs">
                  <span>{t('By')}</span>
                  <span className="font-medium">{template.author}</span>
                  <span>•</span>
                  <span>
                    {formatUtils.formatDate(new Date(template.created))}
                  </span>
                </div>

                <div className="mb-12" />
              </div>
            </div>
          </ScrollArea>

          <div
            ref={canvasContainerRef}
            className="bg-muted/30 h-full w-full relative overflow-hidden border-l"
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
              <div className="text-muted-foreground text-sm flex items-center justify-center h-full" />
            ) : (
              <div className="text-muted-foreground text-sm flex items-center justify-center h-full">
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
