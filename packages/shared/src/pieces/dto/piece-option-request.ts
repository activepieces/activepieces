export interface PieceOptionRequest {
    stepName: string;
    configName: string;
    configs: Record<string, any>;
}

export const PieceOptionRequestSchema = {
    body: {
        type: 'object',
        properties: {
            stepName: {type: 'string'},
            configName: {type: 'string'},
            configs: {type: 'object'}
        },
        required: ['stepName', 'configName', 'configs']
    }
}