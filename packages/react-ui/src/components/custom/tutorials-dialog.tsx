import { Bot, GraduationCap, ListTodo, Star, Table2, VideoIcon, Workflow, X } from "lucide-react"
import { Button } from "../ui/button"
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog"
import { t } from "i18next"
import { Tabs, TabsTrigger, TabsList } from '@/components/ui/tabs';

import mcpDark from '@/assets/img/custom/mcp-dark.svg';
import mcpLight from '@/assets/img/custom/mcp-light.svg';
import { useTheme } from "../theme-provider";
import { Separator } from "../ui/separator";
import { useState } from "react";

type TabType = 'flows' | 'mcpServers' | 'tables' | 'agents' | 'todos' | 'gettingStarted';
const TutorialsDialog = ({ initialTab }: { initialTab: TabType }) => {
    const { theme } = useTheme();
    const tabs = {
        gettingStarted: {
            icon: <Star className="size-4"></Star>,
            name: t('Getting Started'),
            description: t('Get started with Activepieces'),
            link: `https://www.youtube.com/embed/cUbkaBFvHLE?si=t9ZEpk4-rt-OdY5t`
        },
        flows: 
        {
            icon: <Workflow className="size-4"></Workflow>,
            name: t('Flows'),
            description: t('Automate repetitive tasks to save your time'),
            link: `https://www.youtube.com/embed/DKMytbveZek?si=MqvSCYv6ItRvgxHj`
        },
        mcpServers: 
        {
            icon: <img
            src={theme === 'dark' ? mcpDark : mcpLight}
            alt="MCP"
            className="color-foreground size-4"
          />,
          name: t('MCP Servers'),
          description: t('Connect AI tools to external apps'),
          link: `https://www.youtube.com/embed/VgcWvsEgLHg?si=knwXBqONhp4fZ1Iu`
        },
        tables: 
        {
            icon: <Table2 className="size-4"></Table2>,
            name: t('Tables'),
            description: t('Store and automate your data'),
            link: `https://www.youtube.com/embed/8AWuPITw_Dc?si=AmX8922qbayFetIM`
        },
        agents: 
        {
            icon: <Bot className="size-4"></Bot>,
            name: t('Agents'),
            description: t('Add a touch of AI to your workflows'),
            link: `https://www.youtube.com/embed/SjjCgT5gERc?si=UV1YCH5TmTgxnEyO`
        },
        todos: 
        {
            icon: <ListTodo className="size-4"></ListTodo>,
            name: t('Todos'),
            description: t('Manage tasks that require human approval'),
            link: `https://www.youtube.com/embed/BYCb_YzkoF8?si=1XU0SBI4t368MFLe`
        },
    } as const
    const [selectedTab, setSelectedTab] = useState<TabType>(initialTab);
        

    return (
        <Dialog>
            <DialogTrigger>
                <Button variant="outline-primary" className="size-5 p-0" size="icon">
                    <VideoIcon className="size-4"></VideoIcon>
                </Button>
            </DialogTrigger>
            <DialogContent className="p-0 h-[80vh] w-[70vw] max-w-[1280px] overflow-hidden">
                <div className="flex flex-col">
                <DialogHeader>
                    <DialogTitle>
                        <div className="p-6 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 p-6 border-b border-gray-100">
                            <div className="text-2xl font-bold mb-2 flex items-center gap-2 relative">
                              <GraduationCap className="size-6"></GraduationCap>  {t('Activepieces Crash Course')}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {t('Step by step guide to get you started')}
                            </div>
                            <DialogClose asChild>
                                <Button variant="accent" size={'icon'} className="rounded-full absolute top-1 right-1">
                                </Button>
                            </DialogClose>
                  
                        </div>
                    </DialogTitle>
                </DialogHeader>
                <div className="flex flex-col grow">
                        <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as TabType)} className="overflow-x-auto  w-[70vw] max-w-[1280px]">
                        <TabsList className="  bg-background  p-0 justify-start rounded-none " >
                        {Object.entries(tabs).map(([key, tab]) => (
                        <TabsTrigger
                            key={key}
                            value={key}
                            className={`flex gap-2 rounded-none bg-background h-full w-[150px] 
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
            <div className="rounded-2xl overflow-hidden shadow-xl grow p-2 flex">
                        <iframe
                       
                            src={tabs[selectedTab].link }
                            title={tabs[selectedTab].name}
                            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            className="grow rounded-2xl"
                        ></iframe>
                        </div>
                </div>
                
                </div>
                
            </DialogContent>
        </Dialog>
    )
}

TutorialsDialog.displayName = 'TutorialsDialog';

export default TutorialsDialog;