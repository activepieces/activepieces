import { Level, Logger, pino, TransportTargetOptions } from 'pino'

export type AxiomCredentials = {        
    dataset: string | undefined
    token: string | undefined
}

export const createAxiomTransport = (level: Level, targets: TransportTargetOptions[], axiom?: AxiomCredentials): Logger | null => {
    if (!axiom) {
        return null
    }
    const dataset = axiom.dataset
    const token = axiom.token
    if (!dataset || !token) {
        return null
    }

    return pino(
        { level },
        pino.transport({
            targets: [
                {
                    target: '@axiomhq/pino',
                    options: {
                        dataset,
                        token,
                    },
                },
                ...targets,
            ],
        }),
    )
} 