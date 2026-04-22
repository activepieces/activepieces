import { repoFactory } from '../core/db/repo-factory'
import { ProjectEntity } from './project-entity'

export const projectRepo = repoFactory(ProjectEntity)
