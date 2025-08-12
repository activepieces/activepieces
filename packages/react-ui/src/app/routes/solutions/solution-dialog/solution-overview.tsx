import { Table, Workflow, Plug, Copy, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ImageWithFallback from '@/components/ui/image-with-fallback';
import PieceIconWithPieceName from '@/features/pieces/components/piece-icon-from-name';
import { solutions } from '../solutions';

interface SolutionOverviewProps {
    solution: typeof solutions[0];
    onAction: () => void;
    actionLabel: string;
    actionIcon?: React.ReactNode;
}

const SolutionOverview = ({ solution, onAction, actionLabel, actionIcon }: SolutionOverviewProps) => {
    return (
        <div className="w-1/3 border-l pb-6 px-6 flex-shrink-0 flex flex-col">
            <div className="space-y-6 flex-1">
                {/* Thumbnail */}
                {solution.thumbnail && (
                    <div>
                        <ImageWithFallback
                            src={solution.thumbnail}
                            alt={solution.name}
                            className="w-full h-48 object-cover rounded-lg"
                        />
                    </div>
                )}

                {/* Assets section */}
                <div>
                    <h3 className="text-base font-semibold mb-3">Assets</h3>
                    <div className="space-y-2">
                        {solution.state.flows.map((flow) => (
                            <div key={flow.version.id} className="flex items-center gap-2 text-sm font-medium">
                                <Workflow className="h-4 w-4" />
                                {flow.version.displayName}
                            </div>
                        ))}
                        {solution.state.connections?.map((connection) => (
                            <div key={connection.externalId} className="flex items-center gap-2 text-sm font-medium">
                                <Plug className="h-4 w-4" />
                                {connection.displayName}
                                <PieceIconWithPieceName pieceName={connection.pieceName} size="sm" />
                            </div>
                        ))}
                        {solution.state.tables?.map((table) => (
                            <div key={table.externalId || table.id} className="flex items-center gap-2 text-sm font-medium">
                                <Table className="h-4 w-4" />
                                {table.name}
                            </div>
                        ))}
                        {solution.state.agents?.map((agent, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm font-medium">
                                <Bot className="h-4 w-4" />
                                {agent.displayName}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Action button at bottom */}
            <div className="mt-6">
                <Button className="w-full" onClick={onAction}>
                    {actionIcon}
                    {actionLabel}
                </Button>
            </div>
        </div>
    );
};

export { SolutionOverview }; 