import { ReactFlowProvider } from '@xyflow/react';
import { t } from 'i18next';
import {
  ArrowLeft,
  Download,
  Share2,
  BookOpen,
  User,
  Calendar,
  Users,
  ArrowRight,
} from 'lucide-react';
import { useMemo, useState, useRef, useEffect } from 'react';
import {
  Navigate,
  useLocation,
  useParams,
  useNavigate,
} from 'react-router-dom';
import { toast } from 'sonner';

import { BuilderStateProvider } from '@/app/builder/builder-state-provider';
import { FlowCanvas } from '@/app/builder/flow-canvas';
import { CanvasControls } from '@/app/builder/flow-canvas/canvas-controls';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar-shadcn';
import { TagWithBright } from '@/components/ui/tag-with-bright';
import { templatesHooks } from '@/features/templates/hooks/templates-hook';
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
} from '@activepieces/shared';

import { PieceCard } from './piece-card';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { UseTemplateDialog } from './use-template-dialog';
import { FlowCard } from './flow-card';

const TemplateDetailsPage = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const token = authenticationSession.getToken();
  const location = useLocation();
  const navigate = useNavigate();
  if (!templateId) {
    return <Navigate to="/templates" replace />;
  }

  const { data: template, isLoading } = templatesHooks.useTemplate(templateId, {
    type: TemplateType.OFFICIAL,
  });
  console.log('template', template);
  const [hasCanvasBeenInitialised, setHasCanvasBeenInitialised] =
    useState(false);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedFlowIndex, setSelectedFlowIndex] = useState(0);
  const [renderKey, setRenderKey] = useState(0);
  const { setOpen } = useSidebar();
  const hasClosedSidebar = useRef(false);

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
      setRenderKey(prev => prev + 1);
    }, 50);
    return () => clearTimeout(timer);
  }, [selectedFlowIndex]);

  if (isNil(token)) {
    return (
      <Navigate
        to={`/sign-in?${FROM_QUERY_PARAM}=${location.pathname}${location.search}`}
        replace
      />
    );
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!template) {
    return <Navigate to="/templates" replace />;
  }

  const formatUsageCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const handleExportJson = () => {
    const dataStr = JSON.stringify(template, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.name}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleUseTemplate = () => {
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
    const shareUrl = `${window.location.origin}/templates/${templateId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t('Link copied to clipboard!'));
    } catch (error) {
      toast.error(t('Failed to copy link'));
    }
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/templates')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-semibold">{t('Back')}</span>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportJson}>
            <Download className="w-4 h-4 mr-2" />
            {t('Export Json')}
          </Button>
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            {t('Share')}
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] h-full">
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-4 px-6 mt-6">
              <span className="text-2xl font-bold">{template.name}</span>

              <div className="flex gap-2 flex-wrap">
                {template.tags.map((tag, index) => (
                  <TagWithBright
                    key={index}
                    prefix={t('Save')}
                    title={tag.title}
                    color={tag.color}
                    size="sm"
                  />
                ))}
              </div>

              <div className="flex flex-col gap-8">

                <div className="flex flex-col gap-3">
                  <Button onClick={handleUseTemplate} size="xl">
                    {t('Use Template')}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleUseWithGuide}
                    size="xl"
                  >
                    {t('Use with the guide setup')}
                    <BookOpen className="w-4 h-4 ml-2" />
                  </Button>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-sm font-semibold">
                    {t('About this template')}
                  </span>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {template.description}
                  </p>
                </div>

                {template.flows && template.flows.length > 1 && (
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-semibold">
                      {t('Included Flows')}
                    </span>

                    <div className="grid grid-cols-1 gap-3">
                      {template.flows.map((flow, index) => (
                        <FlowCard
                          key={index}
                          flow={flow}
                          isSelected={selectedFlowIndex === index}
                          onClick={() => setSelectedFlowIndex(index)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <span className="text-sm font-semibold">
                    {t('Tools & Services')}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {template.pieces.map((pieceName, index) => (
                      <PieceCard key={index} pieceName={pieceName} />
                    ))}
                  </div>
                </div>


                <Separator className="my-2" />

                <div className="flex flex-col gap-4 mb-12">
                  <div className="flex gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div className="flex flex-col gap-2">
                      <span className="text-muted-foreground text-xs">
                        {t('Author')}
                      </span>
                      <span className="font-medium">{template.author}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div className="flex flex-col gap-2">
                      <span className="text-muted-foreground text-xs">
                        {t('Created')}
                      </span>
                      <span className="font-medium">
                        {formatUtils.formatDate(new Date(template.created))}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <div className="flex flex-col gap-2">
                      <span className="text-muted-foreground text-xs">
                        {t('Used by')}
                      </span>
                      <span className="font-medium">
                        {formatUsageCount(template.usageCount)} {t('users')}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

            </div>
          </ScrollArea>

          <div
            ref={canvasContainerRef}
            className="bg-muted/30 h-full relative overflow-hidden border-l"
          >
            {mockFlow && renderKey > 0 ? (
              <div key={renderKey} className="h-full w-full">
                <ReactFlowProvider>
                  <BuilderStateProvider
                    flow={mockFlow}
                    flowVersion={mockFlow.version}
                    readonly={true}
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
      <UseTemplateDialog template={template} open={isDialogOpen} onOpenChange={setIsDialogOpen} />
    </div>
  );
};

export { TemplateDetailsPage };
