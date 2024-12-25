import { Server, Socket } from "socket.io";
import { runScenarios, scenarios } from "../scenario/scenario-runner";
import { State, WebsocketCopilotResult, WebsocketEventTypes } from "@activepieces/copilot-shared";
import { plannerAgent } from "../agents/planner";


let currentState: State = {
    scenarios: scenarios.map((scenario) => {
        return {
            title: scenario.title,
            prompt: scenario.prompt,
            status: 'stopped',
        };
    }),
};

export function startWebSocketServer() {
    const io = new Server(3002, {
        cors: {
            origin: "*"
        }
    });

    // Handle new Socket.IO connections
    io.on('connection', (socket: Socket) => {
        
        // Handle incoming messages
        socket.on(WebsocketEventTypes.RUN_TESTS, async (data: {scenarioTitle: string}) => {
            await runScenarios(plannerAgent, [data.scenarioTitle], socket);
        });

        socket.on(WebsocketEventTypes.GET_STATE, async (message) => {
            socket.emit(WebsocketEventTypes.RESPONSE_GET_STATE, currentState);
        });

    });
}

function updateTestState(socket: Socket | null, scenarioTitle: string, status: 'running' | 'stopped') {

    if (socket) {
        socket.emit(WebsocketEventTypes.RESPONSE_GET_STATE, {
            ...currentState,
            scenarios: currentState.scenarios.map((scenario) => ({
                ...scenario,
                status: scenario.title === scenarioTitle ? status : scenario.status,
            })),
        });
    }
}

function addResult(socket: Socket | null, result: WebsocketCopilotResult) {
    if (socket) {
        socket.emit('update-results', result);
    }
}

export const websocketUtils = {
    updateTestState,
    addResult,
}