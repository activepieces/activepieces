import { t } from 'i18next';
import { Plus, Bot } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { TableTitle } from '@/components/ui/table-title';
import { AgentCard } from './agent-card';
import { AgentBuilder } from './agent-builder';

export const AgentsPage = () => {
    const agents = [
        {
            id: '1',
            picture: 'https://cdn.activepieces.com/quicknew/agents/robots/robot_7000.png',
            name: 'Customer Support Bot',
            description: 'Handles customer inquiries and provides instant responses 24/7',
        },
        {
            id: '2',
            picture: 'https://cdn.activepieces.com/quicknew/agents/robots/robot_7001.png',
            name: 'Data Analyst',
            description: 'Processes and analyzes data to generate insights and reports',
        },
        {
            id: '3',
            picture: 'https://cdn.activepieces.com/quicknew/agents/robots/robot_7002.png',
            name: 'Content Writer',
            description: 'Creates and optimizes content for blogs and social media',
        },
        {
            id: '4',
            picture: 'https://cdn.activepieces.com/quicknew/agents/robots/robot_7003.png',
            name: 'Task Scheduler',
            description: 'Manages and automates recurring tasks and workflows',
        },
    ]
    const [isOpen, setIsOpen] = useState(false);


    return (
        <>
            <div className="flex items-center justify-between">
                <TableTitle
                    description={t(
                        'Build and manage your team of digital workers',
                    )}
                >
                    {t('Agents')}
                </TableTitle>
                <AgentBuilder
                    isOpen={isOpen}
                    onOpenChange={setIsOpen}
                    trigger={<Button onClick={() => setIsOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        {t('Create Agent')}
                    </Button>}
                />
            </div>

            <div className="mt-4">
                {agents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-[400px] border-2 border-dashed rounded-lg bg-gradient-to-br from-background to-muted/20">
                        <div className="w-32 h-32 mb-6 relative">
                            <Bot className="w-full h-full" />
                            <div className="absolute inset-0 bg-primary/10 rounded-full blur-xl"></div>
                        </div>
                        <h3 className="text-xl font-semibold mb-2 bg-clip-text text-transparent from-primary to-primary/60">
                            {t('No agents yet')}
                        </h3>
                        <p className="text-muted-foreground text-center max-w-md">
                            {t('Get started by creating your first agent to automate tasks and workflows')}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-4">
                        {agents.map((agent) => (
                            <AgentCard key={agent.id} title={agent.name} description={agent.description} picture={agent.picture} />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
