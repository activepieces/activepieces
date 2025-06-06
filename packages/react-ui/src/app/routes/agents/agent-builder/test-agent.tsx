import { FlaskConical, Play } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { agentsApi } from '../agents-api';
import { Todo } from '@activepieces/shared';
import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { TodoDetails } from '../../todos/todo-details';
import { Textarea } from '@/components/ui/textarea';

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

    useEffect(() => {
        if (isDialogOpen) {
            setTestPrompt('');
            setCreatedTodo(null);
        }
    }, [isDialogOpen]);

    const runAgentMutation = useMutation({
        mutationFn: (testPrompt: string) => {
            return agentsApi.run(agentId, { prompt: testPrompt });
        },
        onSuccess: (todo: Todo) => {
            setCreatedTodo(todo);
            onSuccess?.();
        },
    });

    const handleRun = () => {
        if (!testPrompt.trim()) return;
        runAgentMutation.mutate(testPrompt);
    };

    const handleClose = () => {
        setIsDialogOpen(false);
    };

    return (
        <div>
            <Button
                variant="default"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => setIsDialogOpen(true)}
                disabled={disabled}
            >
                <Play className="h-4 w-4" />
                Run Test
            </Button>

            <Dialog open={isDialogOpen} onOpenChange={handleClose}>
                <DialogContent className="w-full max-w-3xl overflow-hidden">
                    {!createdTodo && (
                        <>
                            <DialogHeader>
                                <DialogTitle>Run Test</DialogTitle>
                            </DialogHeader>
                            <div className="p-0">
                                <div className="p-0 space-y-4">
                                    <Textarea
                                        value={testPrompt}
                                        onChange={(e) => setTestPrompt(e.target.value)}
                                        placeholder="Schedule a meeting with the marketing team for next Monday at 2 PM"
                                        className="min-h-[100px] resize-none w-full"
                                    />
                                    <Button
                                        className="w-full"
                                        onClick={handleRun}
                                        disabled={runAgentMutation.isPending || !testPrompt.trim()}
                                    >
                                        {runAgentMutation.isPending ? 'Running...' : 'Run Test'}
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                    {createdTodo && (
                        <TodoDetails
                            className="h-[80vh] p-0"
                            todoId={createdTodo.id}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};