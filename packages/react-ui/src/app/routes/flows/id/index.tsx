import { BuilderNavBar } from "@/features/flow-canvas/components/builder-nav-bar";
import { FlowCanvas } from "@/features/flow-canvas/components/canvas";
import { useParams } from "react-router-dom";
import { PopulatedFlow } from "@activepieces/shared";
import { useQuery } from "@tanstack/react-query";
import { flowsApi } from "@/features/flows/lib/flows-api";
import { useEffect } from "react";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable-panel";
import { PieceSelectorList } from "@/features/pieces/components/piece-selector-list";

const FlowBuilderPage = () => {
    const { flowId } = useParams();
    const { data: flow, isLoading, isError, isSuccess, refetch } = useQuery<PopulatedFlow, Error>({
        queryKey: ['flow', flowId],
        queryFn: () => flowsApi.get(flowId!),
        enabled: !!flowId
    });

    useEffect(() => {
        if (flowId) {
            refetch();
        }
    }, [flowId]);

    return (
        <div className="w-screen h-screen flex flex-col">
            <BuilderNavBar />
            <ResizablePanelGroup direction="horizontal">
                <ResizablePanel defaultSize={75}>
                    <>
                        {isLoading && <div>Loading...</div>}
                        {isError && <div>Error, please try again.</div>}
                        {isSuccess && flow && <FlowCanvas flow={flow} />}</>
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={25}>
                    <PieceSelectorList />

                </ResizablePanel>
            </ResizablePanelGroup>

        </div>
    )
}

export { FlowBuilderPage };