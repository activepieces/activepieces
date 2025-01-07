import { flowRepo } from "./app/flows/flow/flow.repo"
import { system } from "./app/helper/system/system"
import { projectRepo } from "./app/project/project-service"
import { gitRepoService } from "./app/ee/project-release/git-sync/git-sync.service"


export const temporaryMigration = {
    async backfill() {
        // 
        const projects = await projectRepo().find()
        for(const project of projects) {
            const gitRepo = await gitRepoService(system.globalLogger()).getOneByProjectOrThrow({ projectId: project.id })
            const flows = await flowRepo().find({ where: { projectId: project.id } })
            // Try to match the external Id with something in the git repo and update
            const repoState = await gitRepoService(system.globalLogger()).getState({ gitRepo, userId: project.ownerId, log: system.globalLogger() })
            for(const flow of repoState.flows) {
                const flowState = flows.find(f => f.versions[f.versions.length - 1].displayName === flow.version.displayName)
                if(flowState) {
                    await flowRepo().update(flowState.id, { externalId: flow.externalId })
                }
            }
        }
    }
}