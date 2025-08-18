import { t } from "i18next"
import { HandWave } from "@/assets/img/custom/hand-wave"
import { ArrowRight, Table2, Workflow } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HorizontalSeparatorWithText } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

export const EmptyHomePage = () => {
    return (
        <ScrollArea className="w-full h-full pt-10">
            <div className="mb-16">
            <h1 className="text-5xl leading-[1.2] justify-center font-bold bg-gradient-to-r dark:from-gray-700 dark:via-purple-700 dark:to-indigo-700 from-gray-900 via-purple-900 to-indigo-900 bg-clip-text text-transparent mb-6 flex gap-2 items-center">
                {t('Goodbye Mundane. Hello AI ')}
                <HandWave className="w-14 h-14" />
            </h1>
            <p className="text-xl text-accent-foreground/70 flex justify-center leading-relaxed">
                 {t('Let AI handle the repetitive work while you focus on what matters most.')}
            </p>
            </div>
          <div>
            <QuickStartSection />
          </div>
        </ScrollArea>
    )
}

export const QuickStartSection = () => {
    return (<>
    <p className="text-2xl font-semibold text-accent-foreground text-center mb-10 ">
                {t('Quickstart with these templates')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto mb-20">
                {templates.map((template) => (
                    <QuickStartTemplateCard key={template.title} template={template} />
                ))}
            </div>
            <HorizontalSeparatorWithText className="mb-12 text-accent-foreground/70 max-w-7xl mx-auto">
            <div className="px-8 py-3 text-sm font-medium  tracking-wider">
            {t('OR BUILD FROM SCRATCH')}
            </div>
            </HorizontalSeparatorWithText>
            <StartFromScratchSection />
            </>)
}
type QuickStartTemplate = {
    type: 'table' | 'flow';
    title: string;
    description: string;
    icon: string;
}
const templates:QuickStartTemplate[] = [
    {
        type: 'table',
        title: t('Support Hero'),
        description: t('Handle customer inquiries automatically and route complex issues to human agents with intelligent responses'),
        icon: 'https://cdn.activepieces.com/quicknew/agents/robots/robot_6558.png'
    },
    {
        type: 'table',
        title: t('Lead Hunter'),
        description: t('Score leads automatically and send personalized outreach messages based on behavior patterns'),
        icon: 'https://cdn.activepieces.com/quicknew/agents/robots/robot_4417.png'
    },
    {
        type: 'flow',
        title: t('Email Wizard'),
        description: t('Create, schedule, and optimize email campaigns with AI-powered insights and A/B testing'),
        icon: 'https://cdn.activepieces.com/quicknew/agents/robots/robot_8180.png'
    }
]


const QuickStartTemplateCard = ({ template }: { template: QuickStartTemplate }) => {
    return (
        <div className="bg-background rounded-2xl p-8 shadow-sm border border-border cursor-pointer group hover:shadow-lg transition-all duration-300  hover:-translate-y-[1px] relative flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <img src={template.icon} alt={template.title} className="w-16 h-16 rounded-full" />
              {
                template.type === 'table' && (<Table2 className="text-green-500 w-6 h-6"></Table2>)
            }
            {
                template.type === 'flow' && (<Workflow className="text-blue-500 w-6 h-6"></Workflow>)
            }
            </div>
            <h3 className="text-2xl font-semibold mb-2">
                {template.title}
            </h3>
            <p className="text-accent-foreground leading-relaxed mb-6 flex-1 text-left">{template.description}</p>
            <div>
            <Button variant="outline-primary" >
                {t('Use Agent')} <ArrowRight className="w-4 h-4" />
            </Button>
            </div>
           
        </div>
    )
}


const StartFromScratchCard = ({type}: {type: 'table' | 'flow'}) => {
    return (<div className="text-center" >
        <div className="flex items-center justify-center mb-5">
        {
            type === 'table' && (<Table2 className="text-green-500 w-10 h-10"></Table2>)
        }
        {
            type === 'flow' && (<Workflow className="text-blue-500 w-10 h-10"></Workflow>)
        }
        </div>
         <h3 className="text-xl font-semibold mb-4">
            {
                type === 'table' && t('Agent in a Table')
            }
            {
                type === 'flow' && t('Agent in a Flow')
            }
         </h3>
         <p>
            {
                type === 'table' && t("Invite an AI agent to work right on your data, it can help you research data and take actions based on your data. It's like a human working with you in a sheet, but an AI.")
            }
            {
                type === 'flow' && t("Build multi-step workflows where AI agents make smart decisions and connect different apps together. Perfect for complex automations.")
            }
         </p>

         <Button className="mt-10" variant="secondary">
          {
            type === 'table' && t('Start with Tables')
          }
          {
            type === 'flow' && t('Start with Flows')
          }
         </Button>

    </div>)
}
const StartFromScratchSection = () => {
   return <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch max-w-7xl mx-auto">
            <StartFromScratchCard type="table" />
            <StartFromScratchCard type="flow" />
    </div>
}