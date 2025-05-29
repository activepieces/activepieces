import { ExternalLink, Workflow, Link as LinkIcon, Play } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { flowsApi } from "@/features/flows/lib/flows-api";

type TodoLinksProps = {
    flowId?: string;
    runId?: string;
}

export const TodoLinks = ({
    flowId,
    runId,
}: TodoLinksProps) => {
    const { data: flow } = useQuery({
        queryKey: ['flow', flowId],
        queryFn: () => flowId ? flowsApi.get(flowId) : null,
        enabled: !!flowId,
    });

    if (!flowId) {
        return null;
    }

    return (
        <div className="flex flex-col gap-2 mt-2">
            <div className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Links</h3>
            </div>
            <div className="flex flex-col gap-2">
                <Card className="p-3" hoverable>
                    <a
                        href={runId ? `/runs/${runId}` : `/flows/${flowId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 "
                    >
                        {runId ? (
                            <Play className="h-4 w-4" />
                        ) : (
                            <Workflow className="h-4 w-4" />
                        )}
                        <div className="flex-1">
                            <div className="font-medium">
                                {runId ? 'Run' : flow?.version.displayName || 'Flow'}
                            </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </a>
                </Card>
            </div>
        </div>
    );
};