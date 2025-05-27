import { ArrowLeft, ChevronDown, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    RightDrawer,
    RightDrawerContent,
    RightDrawerHeader,
    RightDrawerTitle,
} from '@/components/right-drawer';
import { ReactNode, useState } from 'react';
import { EditableTextWithPencil } from '@/components/ui/editable-text-with-pencil';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AgentBuilderProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    trigger: ReactNode;
}

export const AgentBuilder = ({ isOpen, onOpenChange, trigger }: AgentBuilderProps) => {

    const [agentName, setAgentName] = useState('TrendSpark');
    const [agentDescription, setAgentDescription] = useState('I analyze trends, suggest startup ideas, and help you build.');
    const [selectedModel, setSelectedModel] = useState('GPT-4');
    const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant that analyzes trends and provides startup ideas. Be creative, insightful, and practical in your responses.');

    const availableModels = ['GPT-4', 'GPT-3.5 Turbo', 'Claude-3', 'Gemini Pro'];

    return (
        <RightDrawer open={isOpen} onOpenChange={onOpenChange} className="w-full" dismissible={false}>
            {trigger}
            <RightDrawerContent>
                <RightDrawerHeader>
                    <div className="p-4">
                        <div className="flex items-center gap-1">
                            <Button
                                variant="basic"
                                size={"icon"}
                                className="text-foreground"
                                onClick={() => onOpenChange(false)}
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <RightDrawerTitle>Agent Builder</RightDrawerTitle>
                        </div>
                    </div>
                </RightDrawerHeader>

                <div className="flex flex-1 h-full justify-center">
                        <div className="w-[800px] overflow-y-auto px-6 pb-6 space-y-6">
                            <div className="flex flex-col md:flex-row items-start gap-6">
                                <div className="flex-shrink-0">
                                    <img
                                        src="https://cdn.activepieces.com/quicknew/agents/robots/robot_7000.png"
                                        alt="Agent avatar"
                                        className="w-20 h-20 rounded-xl object-cover border"
                                    />
                                </div>
                                <div className="flex flex-col flex-1">
                                    <div className="flex items-center gap-2 justify-between">
                                        <EditableTextWithPencil
                                            value={agentName}
                                            className="text-2xl font-semibold"
                                            readonly={false}
                                            onValueChange={setAgentName}
                                        />
                                        <Button size={"sm"} variant={"default"}>
                                            <div className="flex items-center gap-2">
                                                <Play className="h-4 w-4" />
                                                Run
                                            </div>
                                        </Button>
                                    </div>
                                    <div className="mt-1 mb-3">
                                        <EditableTextWithPencil
                                            value={agentDescription}
                                            className="text-muted-foreground"
                                            readonly={false}
                                            onValueChange={setAgentDescription}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Model Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="model-select">Model</Label>
                                <Select value={selectedModel} onValueChange={setSelectedModel}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a model" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableModels.map((model) => (
                                            <SelectItem key={model} value={model}>
                                                {model}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* System Prompt Section */}
                            <div className="space-y-2">
                                <Label htmlFor="system-prompt">System Prompt</Label>
                                <Textarea
                                    id="system-prompt"
                                    value={systemPrompt}
                                    onChange={(e) => setSystemPrompt(e.target.value)}
                                    placeholder="Enter the system prompt for your agent..."
                                    className="min-h-[120px] resize-none"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Define how your agent should behave and respond to users.
                                </p>
                            </div>

                            {/* Tools Section */}
                            <div className="space-y-3">
                                <Label>Tools</Label>
                                <div className="grid grid-cols-1 gap-2">

                                </div>

                            </div>
                        </div>
                </div>
            </RightDrawerContent>
        </RightDrawer>
    );
};
