import { FlowAction, FlowActionType, FlowTrigger, FlowVersion, isNil, RouterAction } from "@activepieces/shared";
import { Edge, Node } from "@xyflow/react";

export const flowCanvasUtils = {
    convertFlowVersionToGraph: (rootStep: FlowTrigger | FlowAction) => {
        const nodes: Node[] = [];
        const edges: Edge[] = [];
        let currentAction: FlowAction | FlowTrigger = rootStep;
        let parentActionName: string | undefined = undefined;
        while (!isNil(currentAction)) {
            const node: Node = {
                id: currentAction.name,
                type: 'stepNode',
                position: { x: 0, y: 0 },
                data: {

                },
            };
            if (!isNil(parentActionName)) {
                edges.push({
                    id: `${parentActionName}-${currentAction.name}-edge`,
                    source: parentActionName,
                    target: currentAction.name,
                    type: 'smoothstep', // Set edge type to smoothstep
                });
            }
            nodes.push(node);

            switch(currentAction.type) {
                case FlowActionType.ROUTER: {
                    const routerAction = currentAction as RouterAction;
                    for (const child of routerAction.children) {
                        if (!isNil(child)) {
                            edges.push({
                                id: `${routerAction.name}-${child.name}-edge`,
                                source: routerAction.name,
                                target: child.name,
                                type: 'smoothstep', 
                            });
                            const { nodes: childNodes, edges: childEdges } = flowCanvasUtils.convertFlowVersionToGraph(child);
                            nodes.push(...childNodes);
                            edges.push(...childEdges);
                        }
                    }
                    break;
                }
                default:
                    break;
            }
            parentActionName = currentAction.name;
            currentAction = currentAction.nextAction;
        }
        return { nodes, edges };
    }
}
