import { BuilderNavBar } from "@/features/flow-canvas/components/builder-nav-bar";
import { FlowCanvas } from "@/features/flow-canvas/components/canvas";
import { useParams } from "react-router-dom";
import { PopulatedFlow } from "@activepieces/shared";
import { useQuery } from "@tanstack/react-query";
import { flowsApi } from "@/features/flows/lib/flows-api";
import { useEffect } from "react";

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
            {isLoading && <div>Loading...</div>}
            {isError && <div>Error, please try again.</div>}
            {isSuccess && flow && <FlowCanvas flow={flow} />}
        </div>
    )
}

export { FlowBuilderPage };