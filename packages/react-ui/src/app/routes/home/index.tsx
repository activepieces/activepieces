import { HandWave } from "@/assets/img/custom/hand-wave";
import { ScrollArea } from "@/components/ui/scroll-area"
import { userHooks } from "@/hooks/user-hooks";
import { cn } from "@/lib/utils";
import { t } from "i18next"
import { Bot, CheckSquare, Table2, TrendingUp, Workflow } from "lucide-react";
import { QuickStartSection } from "./empty-home";
import TutorialsDialog from "@/components/custom/tutorials-dialog";
import { McpSvg } from "@/assets/img/custom/mcp";
import { Button } from "@/components/ui/button";
import { PartyPopper } from "@/assets/img/custom/party-popper";


export const HomePage = () => {
    const { data: currentUser } = userHooks.useCurrentUser();
    return (
        <ScrollArea className="w-full h-full pt-10 ">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold flex items-center  flex items-center">
                    {t('Welcome back,')} {currentUser?.firstName} !
                    <HandWave className="w-14 h-14" />
                </h1>
                <p className="text-lg text-accent-foreground/70 ">
                    {t("Here's what's happening with your automations today.")}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 mt-8">
                    <AnalyticsCard type="flow" />
                    <AnalyticsCard type="table" />
                    <AnalyticsCard type="agent" />
                    <AnalyticsCard type="MCPs" />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                        <QuickStartSection />

                    </div>  
                    <div className="space-y-6">
                        <GettingStartedCard />
                        <TodosCard />
                        <RunsCard />
                    </div>

                </div>
            </div>

        </ScrollArea>
    )
}


const TodosCard = () => {
    const todosCount:number = 0;

	return (
        <>
        {todosCount > 0 && (
		<div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/30 border border-orange-200 dark:border-orange-800/50 rounded-2xl p-6 shadow-sm">
			<div className="flex items-center mb-3">
				<div className="p-2 bg-orange-500 dark:bg-orange-600 rounded-lg mr-3">
					<CheckSquare className="size-4 text-white" />
				</div>
				<h3 className="font-bold text-orange-900 dark:text-orange-100">{t('Todos Need Attention')}</h3>
			</div>
			<p className="text-orange-800 dark:text-orange-200 mb-4">{t('automationsWaitingForApprovalNote', {count: todosCount})}</p>
			<Button variant="orange" className="w-full px-4 py-3 rounded-xl font-medium shadow-lg hover:shadow-xl">
                {t('Review Tasks')}
                </Button>
		</div>)}

        { todosCount === 0 && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/40 dark:to-emerald-950/30 border border-green-200 dark:border-green-800/50 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center mb-3">
                  <div className="p-2 bg-green-500 dark:bg-green-600 rounded-lg mr-3">
                    <CheckSquare className="size-4 text-white" />
                  </div>
                  <h3 className="font-bold text-green-900 dark:text-green-100 flex items-center gap-2">{t('All Caught Up!')} <PartyPopper className="size-7"></PartyPopper></h3>
                </div>
                <p className="text-green-800 dark:text-green-200">
                  {t('Your AI assistants are working smoothly. No approvals needed right now!')}
                </p>
              </div>
        )}
        </>
	)
}

const GettingStartedCard = () => {
    return  (
    <div className=" rounded-2xl p-6 shadow-sm  border border-border ">
        <h2 className="text-xl font-bold mb-4">{t('Get Started')}</h2>
        <div className="relative">
            <TutorialsDialog  location="home" initialTab="gettingStarted" showTooltip={false} >
                <div className="cursor-pointer">
                <img src="https://img.youtube.com/vi/8ExraM9WLb8/maxresdefault.jpg" alt="Get Started with Activepieces" className="w-full h-40 object-cover rounded-xl"></img>
                <div className="absolute inset-0 bg-opacity-30 rounded-xl flex items-center justify-center group-hover:bg-opacity-40 transition-all">
                    <div className="w-14 h-14 bg-white bg-opacity-95 rounded-full flex items-center justify-center group-hover:bg-opacity-100 transition-all shadow-lg">
                        <div className="w-0 h-0 border-l-[10px] border-l-red-600 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1"></div>
                    </div>
                </div>
                </div>
            
            </TutorialsDialog>
            <p className="text-sm text-accent-foreground/70 mt-3 font-medium">{t('5-minute intro to AI automation')}</p>
        </div>
</div>)
}

const AnalyticsCard = ({ type }: { type: 'table' | 'flow' | 'agent' | 'MCPs' }) => {

    return (
        <div className="bg-background flex items-center gap-4 group rounded-2xl p-6 shadow-sm border border- cursor-pointer group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <div className={cn("p-3 rounded-xl flex items-center text-white justify-center bg-blue-500 shadow-lg", {
                "bg-blue-500": type === 'flow',
                "bg-green-500": type === 'table',
                "bg-purple-500": type === 'agent',
                "bg-indigo-500": type === 'MCPs',
            })}>
                {
                    type === 'flow' && <Workflow className="size-6" />
                }
                {
                    type === 'table' && <Table2 className="size-6" />
                }
                {
                    type === 'agent' && <Bot className="size-6" />
                }
                {
                    type === 'MCPs' && <McpSvg className="size-6" />
                }

            </div>
            <div>
                <div>
                    <p className="text-3xl font-bold group-hover:text-primary transition-colors">
                        1
                    </p>
                    <div className="text-sm font-medium text-accent-foreground/70">
                        {type === 'flow' && t('Active Flows')}
                        {type === 'table' && t('Tables')}
                        {type === 'agent' && t('Agents')}
                        {type === 'MCPs' && t('MCP Servers')}
                    </div>
                </div>

            </div>

        </div>
    )
}


const RunsCard = ()=>{
    const runsAnalytics = [
        {
            title: t('Automations Run'),
            value: 1247,
        },
        {
            title: t('Success Rate'),
            value: '98.2%',
        },
        {
            title: t('Time Saved'),
            value: '24.5 hrs',
        }
    ]
    return (<div className="rounded-2xl p-6 shadow-sm border border-border">
        <h3 className="font-bold text-accent-foreground mb-4 flex items-center">
           <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-lg mr-3">
             <TrendingUp className="w-4 h-4 text-white" />
           </div>
           This Week
        </h3>
        <div className="space-y-4">
           {runsAnalytics.map((run, index)=>(
            <div key={index} className="flex justify-between items-center">
                <span className="text-accent-foreground/70 font-medium">{run.title}</span>
                <span className="font-bold text-accent-foreground text-lg">{run.value}</span>
            </div>
           ))}
               </div>
     </div>)
}