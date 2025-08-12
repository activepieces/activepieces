import { ArrowLeft, Copy } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ApMarkdown } from '@/components/custom/markdown';
import { ScrollArea } from '@/components/ui/scroll-area';
import { solutions } from '../solutions';
import { ConfigureScreen } from './configure-screen';
import { SolutionOverview } from './solution-overview';
import { MarkdownVariant } from '@activepieces/shared';

interface SolutionDialogProps {
    solution: typeof solutions[0];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type Screen = 'overview' | 'configure';

const SolutionDialog = ({ solution, open, onOpenChange }: SolutionDialogProps) => {
    const [screen, setScreen] = useState<Screen>('overview');

    const handleClose = () => {
        onOpenChange(false);
    };

    const handleConfigure = () => {
        setScreen('configure');
    };

    const handleBackToOverview = () => {
        setScreen('overview');
    };

    const handleClone = () => {
        // Handle clone action
        console.log('Clone solution:', solution.name);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl h-[80vh] flex flex-col p-0">
                <DialogHeader className="flex-shrink-0 p-4  mb-0">
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2 min-h-[40px]">
                            {screen === 'configure' && <Button
                                variant="ghost"
                                size="icon"
                                onClick={screen === 'configure' ? handleBackToOverview : handleClose}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>}
                            <DialogTitle>
                                {screen === 'configure' ? `Configure ${solution.name}` : solution.name}
                            </DialogTitle>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden">
                    {screen === 'configure' ? (
                        <div className="flex flex-1 min-h-0 h-full">
                            {/* Left side - Configure screen */}
                            <div className="flex-1 w-2/3 flex flex-col min-h-0">
                                <ConfigureScreen solution={solution} />
                            </div>

                            {/* Right side - Overview */}
                            <SolutionOverview
                                solution={solution}
                                onAction={handleClone}
                                actionLabel="Clone"
                                actionIcon={<Copy className="h-4 w-4" />}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-1 min-h-0 h-full">
                            {/* Left side - 2/3 width for content */}
                            <div className="flex-1 w-2/3 flex flex-col min-h-0">
                                <ScrollArea className="flex-1">
                                    <div className="p-6 pt-0">
                                        <ApMarkdown
                                            markdown={solution.description}
                                            variant={MarkdownVariant.BORDERLESS}
                                            className="prose prose-sm max-w-none"
                                        />
                                    </div>
                                </ScrollArea>
                            </div>

                            {/* Right side - Overview */}
                            <SolutionOverview
                                solution={solution}
                                onAction={handleConfigure}
                                actionLabel="Setup"
                                actionIcon={<Copy className="h-4 w-4" />}
                            />
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export { SolutionDialog };