import { t } from 'i18next';
import {
  Bot,
  GraduationCap,
  ListTodo,
  Star,
  Table2,
  VideoIcon,
  Workflow,
  X,
} from 'lucide-react';
import { useState } from 'react';

import { McpSvg } from '@/assets/img/custom/mcp';
import { Tabs, TabsTrigger, TabsList } from '@/components/ui/tabs';
import { flagsHooks } from '@/hooks/flags-hooks';
import {
  ApFlagId,
  ClickedTutorialTelemetryParams,
  TelemetryEventName,
} from '@activepieces/shared';

import { useTelemetry } from '../telemetry-provider';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import { Separator } from '../ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

export type TabType = ClickedTutorialTelemetryParams['tab'];
const TutorialsDialog = ({
  initialTab,
  children,
  showTooltip = true,
  location,
}: {
  initialTab?: TabType;
  children?: React.ReactNode;
  showTooltip?: boolean;
  location: ClickedTutorialTelemetryParams['location'];
}) => {
  const [selectedTab, setSelectedTab] = useState<TabType>(
    initialTab ?? 'gettingStarted',
  );
  const { capture } = useTelemetry();
  const { data: showTutorials } = flagsHooks.useFlag<boolean>(
    ApFlagId.SHOW_TUTORIALS,
  );
  const tabs: Record<
    TabType,
    { icon: React.ReactNode; name: string; description: string; link: string }
  > = {
    gettingStarted: {
      icon: <Star className="size-4"></Star>,
      name: t('Intro'),
      description: t('Get started with Activepieces'),
      link: `https://www.youtube.com/embed/b97bgcOigIs?si=Zlly9_WkP1oOnJ-K`,
    },
    flows: {
      icon: <Workflow className="size-4"></Workflow>,
      name: t('Flows'),
      description: t('Automate repetitive tasks to save your time'),
      link: `https://www.youtube.com/embed/BWKrqmdNlzY?si=fjKiHx9GJe9eN2_x`,
    },
    agents: {
      icon: <Bot className="size-4"></Bot>,
      name: t('Agents'),
      description: t('Add a touch of AI to your workflows'),
      link: `https://www.youtube.com/embed/9qhhhfKmpoo?si=Ik8FmAmrWxDOggJP`,
    },
    tables: {
      icon: <Table2 className="size-4"></Table2>,
      name: t('Tables'),
      description: t('Store and automate your data'),
      link: `https://www.youtube.com/embed/vj8aGGee6E0?si=6gvulHNgk1rWVWHX"`,
    },
    mcpServers: {
      icon: <McpSvg className="size-4" />,
      name: t('MCPs'),
      description: t('Connect AI tools to external apps'),
      link: `https://www.youtube.com/embed/q1UdLIBZ3Ps?si=Ey8N8oNX9ihJen76`,
    },

    todos: {
      icon: <ListTodo className="size-4"></ListTodo>,
      name: t('Todos'),
      description: t('Manage tasks that require human approval'),
      link: `https://www.youtube.com/embed/csKkXa71eoo?si=EMpJGMsVqzzrF__8`,
    },
  } as const;

  if (!showTutorials) return null;

  return (
    <Dialog>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <div
              onClick={() => {
                capture({
                  name: TelemetryEventName.CLICKED_TUTORIAL,
                  payload: { tab: initialTab ?? 'gettingStarted', location },
                });
              }}
            >
              {children ? (
                children
              ) : (
                <Button variant="outline-primary" size="icon">
                  <VideoIcon className="size-4"></VideoIcon>
                </Button>
              )}
            </div>
          </DialogTrigger>
        </TooltipTrigger>
        {showTooltip && <TooltipContent>{t('Tutorial')}</TooltipContent>}
      </Tooltip>
      <DialogContent
        withCloseButton={false}
        className="p-0 h-[80vh] w-[70vw] max-w-[1280px] overflow-hidden"
      >
        <div className="flex flex-col">
          <DialogHeader>
            <DialogTitle>
              <div className="p-6 bg-gradient-to-br from-primary/10 via-primary/5 to-primary/20 dark:from-primary/20 dark:via-primary/10 dark:to-primary/30 p-6 border-b border-gray-100 dark:border-gray-800">
                <div className="text-2xl font-bold mb-2 flex items-center gap-2 relative">
                  <GraduationCap className="size-6"></GraduationCap>{' '}
                  {t('Activepieces Crash Course')}
                </div>
                <div className="text-sm text-muted-foreground">
                  {tabs[selectedTab].description}
                </div>
                <DialogClose asChild>
                  <Button
                    variant="outline"
                    size={'icon'}
                    className="rounded-full absolute top-2 right-2"
                  >
                    <X className="size-4"></X>
                  </Button>
                </DialogClose>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col grow">
            <Tabs
              value={selectedTab}
              onValueChange={(value) => setSelectedTab(value as TabType)}
              className="overflow-x-auto  w-[70vw] max-w-[1280px]"
            >
              <TabsList className="bg-background  p-0 justify-start rounded-none ">
                {Object.entries(tabs).map(([key, tab]) => (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className={`flex gap-2 rounded-none bg-background h-full w-[120px] 
                            data-[state=active]:text-accent-foreground data-[state=active]:shadow-none
                            border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:active  data-[state=active]:text-primary flex items-center justify-center p-2 [&>svg]:size-5  [&>svg]:shrink-0`}
                  >
                    {tab.icon}
                    <span className="text-[13px]">{tab.name}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            <Separator className="mb-4"></Separator>

            <div className="overflow-hidden shadow-xl grow p-2 flex bg-black">
              <iframe
                key={selectedTab}
                src={`${tabs[selectedTab].link}&autoplay=1&rel=0`}
                title={tabs[selectedTab].name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="grow  w-full h-full"
              ></iframe>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

TutorialsDialog.displayName = 'TutorialsDialog';

export default TutorialsDialog;
