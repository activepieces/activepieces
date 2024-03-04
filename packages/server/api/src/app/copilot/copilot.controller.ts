import { copilotService } from './copilot.service'
import {
    FastifyPluginCallbackTypebox,
    Type,
} from '@fastify/type-provider-typebox'

const GenerateCodeRequest = {
    schema: {
        body: Type.Object({
            prompt: Type.String(),
        }),
    },
}

export const copilotController: FastifyPluginCallbackTypebox = (
    app,
    _options,
    done,
): void => {
    app.post('/code', GenerateCodeRequest, async (req, res) => {
        const { prompt } = req.body

        const result = await copilotService.generateCode({ prompt })
        return res.send({ result })
    })

    app.post('/inputs', GenerateCodeRequest, async (req, res) => {
        const { prompt } = req.body

        const result = await copilotService.generateInputs({ prompt })
        return res.send({ result })
    })

    done()
}
