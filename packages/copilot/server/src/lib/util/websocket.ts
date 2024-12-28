import { Server, Socket } from "socket.io";
import { runScenarios, scenarios } from "../scenario/scenario-runner";
import { State, WebsocketCopilotResult, WebsocketEventTypes, RunTestsParams, WebsocketCopilotUpdate, WebsocketCopilotCommand } from "@activepieces/copilot-shared";
import { plannerAgent } from "../agents/planner";
import { EmbeddedPiece, findRelevantPieces } from "../tools/embeddings";


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
        socket.on(WebsocketEventTypes.RUN_TESTS, async (data: RunTestsParams) => {
            await runScenarios(plannerAgent, [data], socket);
        });

        socket.on(WebsocketEventTypes.GET_STATE, async (message) => {
            socket.emit(WebsocketEventTypes.RESPONSE_GET_STATE, currentState);
        });

        socket.on('message', async (message: any) => {
            await websocketUtils.handleMessage(socket, message);
        });

    });
}

function updateTestState(socket: Socket | null, scenarioTitle: string, status: 'running' | 'stopped') {
    if (socket) {
        // Update global state
        const updatedState = {
            ...currentState,
            scenarios: currentState.scenarios.map((scenario) => ({
                ...scenario,
                status: scenario.title === scenarioTitle ? status : scenario.status,
            })),
        };
        currentState = updatedState;
        socket.emit(WebsocketEventTypes.RESPONSE_GET_STATE, updatedState);

        // Emit test state event
        const scenario = currentState.scenarios.find(s => s.title === scenarioTitle);
        if (scenario) {
            websocketUtils.addResult(socket, {
                type: WebsocketCopilotUpdate.TEST_STATE,
                data: {
                    title: scenario.title,
                    prompt: scenario.prompt,
                    isRunning: status === 'running',
                    timestamp: new Date().toISOString(),
                }
            });
        }
    }
}

function addResult(socket: Socket | null, result: WebsocketCopilotResult) {
    if (socket) {
        socket.emit(WebsocketEventTypes.UPDATE_RESULTS, result);
    }
}

export const websocketUtils = {
    updateTestState,
    addResult,
    async handleMessage(socket: Socket, message: any) {
        console.log('Received message:', message);

        if (message.command === WebsocketCopilotCommand.SEARCH_PIECES) {
            try {
                const pieces = await findRelevantPieces(message.data.query);
                const results = pieces.map((p: EmbeddedPiece) => ({
                    pieceName: p.metadata.pieceName,
                    content: p.content,
                    logoUrl: p.metadata.logoUrl || '',
                    relevanceScore: p.similarity || 0,
                }));

                websocketUtils.addResult(socket, {
                    type: WebsocketCopilotUpdate.PIECES_FOUND,
                    data: {
                        timestamp: new Date().toISOString(),
                        relevantPieces: results
                    }
                });
            } catch (error) {
                console.error('Error searching pieces:', error);
                socket.emit('message', {
                    type: 'ERROR',
                    data: {
                        message: 'Failed to search pieces'
                    }
                });
            }
        }
    },
}