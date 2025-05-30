import { FlaskConical, Play, Info } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { agentsApi } from '../agents-api';
import { Todo } from '@activepieces/shared';
import { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
} from '@/components/ui/dialog';
import { TodoDetails } from '../../todos/todo-details';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDebouncedCallback } from 'use-debounce';

interface TestAgentProps {
    agentId: string;
    onSuccess?: () => void;
    disabled?: boolean;
}

export const TestAgent = ({ agentId, onSuccess, disabled }: TestAgentProps) => {
    const [testPrompt, setTestPrompt] = useState('');
    const [createdTodo, setCreatedTodo] = useState<Todo | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const { data: agent } = useQuery({
        queryKey: ['agent', agentId],
        queryFn: () => agentsApi.get(agentId),
    });

    useEffect(() => {
        if (agent?.testPrompt) {
            setTestPrompt(agent.testPrompt);
        }
    }, [agent?.testPrompt]);

    const updateAgentMutation = useMutation({
        mutationFn: (testPrompt: string) => {
            return agentsApi.update(agentId, { testPrompt });
        },
        onSuccess: () => {
            onSuccess?.();
        },
    });

    const runAgentMutation = useMutation({
        mutationFn: (testPrompt: string) => {
            return agentsApi.run(agentId, { prompt: testPrompt });
        },
        onSuccess: (todo: Todo) => {
            setCreatedTodo(todo);
            setIsDialogOpen(true);
            onSuccess?.();
        },
    });

    const debouncedUpdateTestPrompt = useDebouncedCallback((value: string) => {
        if (value.trim()) {
            updateAgentMutation.mutate(value);
        }
    }, 500);

    const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newTestPrompt = e.target.value;
        setTestPrompt(newTestPrompt);
        debouncedUpdateTestPrompt(newTestPrompt);
    };

    const handleRun = () => {
        if (!testPrompt.trim()) return;
        runAgentMutation.mutate(testPrompt);
    };

    return (
        <div className="w-full space-y-6">
            <Separator className="my-2" />
            <div className="flex items-center justify-between">
                <div className='flex flex-col'>
                    <div className="flex items-center gap-2 text-lg">
                        <FlaskConical className="w-4 h-4" />
                        <span>Test Your Agent</span>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Info className="w-4 h-4 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Test your agent by providing a task or question.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
                <Button
                    variant="neutral"
                    size="sm"
                    className="flex items-center gap-2"
                    onClick={handleRun}
                    disabled={runAgentMutation.isPending || disabled || !testPrompt.trim()}
                >
                    <Play className="h-4 w-4" />
                    {runAgentMutation.isPending ? 'Running...' : 'Run Test'}
                </Button>
            </div>
            <Textarea
                value={testPrompt}
                onChange={handlePromptChange}
                placeholder="Schedule a meeting with the marketing team for next Monday at 2 PM"
                className="min-h-[100px] resize-none w-full"
            />

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="w-full max-w-3xl p-0 overflow-hidden">
                    <DialogHeader />
                    {createdTodo && (
                        <TodoDetails
                            className="h-[90vh] p-0"
                            todoId={createdTodo.id}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};