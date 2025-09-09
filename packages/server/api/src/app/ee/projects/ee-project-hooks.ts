import { FastifyBaseLogger } from 'fastify'
import { ProjectHooks } from '../../project/project-hooks'

export const projectEnterpriseHooks = (log: FastifyBaseLogger): ProjectHooks => ({
    async postCreate(project) {

    },
})