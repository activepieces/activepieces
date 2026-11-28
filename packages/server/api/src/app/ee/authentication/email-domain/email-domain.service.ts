import { repoFactory } from '../../../core/db/repo-factory'
import { EmailDomainEntity } from './email-domain.entity'

export const emailDomainRepo = repoFactory(EmailDomainEntity)
