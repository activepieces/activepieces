import { repoFactory } from '../../core/db/repo-factory'
import { FlowEntity } from './flow.entity'

export const flowRepo = repoFactory(FlowEntity)
