import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import dayjs from 'dayjs'
import { SystemProp, system } from 'server-shared'
import { flagService } from '../../flags/flag.service'
import { databaseConnection } from '../../database/database-connection'
import { UserEntity } from '../../user/user-entity'
import { Between } from 'typeorm'
import { ProjectEntity } from '../../project/project-entity'
import { redisSystemJob } from '../helper/redis-system-job'

const userRepo = databaseConnection.getRepository(UserEntity)
const projectRepo = databaseConnection.getRepository(ProjectEntity)

export const usageTrackerModule: FastifyPluginAsyncTypebox = async () => {
    await redisSystemJob.upsertJob({
        name: 'usage-report',
        data: {},
    }, '*/59 23 * * *', async (job) => {
        const startOfDay = dayjs(job.timestamp).startOf('day').toISOString()
        const endOfDay = dayjs(job.timestamp).endOf('day').toISOString()
        const report = await constructUsageReport(startOfDay, endOfDay)
        await sendUsageReport(report)
    })
}


async function sendUsageReport(report: UsageReport): Promise<void> {
    await fetch('https://cloud.activepieces.com/api/v1/webhooks/ophE6T5QJBe7O3QT0sjvn', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
    })
}

async function constructUsageReport(startDate: string, endDate: string): Promise<UsageReport> {
    const licenseKey = system.getOrThrow(SystemProp.LICENSE_KEY)
    const version = await flagService.getCurrentRelease()
    const addedProjects = await getAddedProjects(startDate, endDate)
    const addedUsers = await getAddedUsers(startDate, endDate)
    const activeProjects = await projectRepo.count()
    const activeUsers = await userRepo.count()
    return {
        timestamp: startDate,
        version,
        licenseKey,
        activeUsers,
        deletedUsers: 0,
        addedUsers: addedUsers.length,
        activeProjects,
        deletedProjects: 0,
        addedProjects: addedProjects.length,
        details: {
            users: addedUsers,
            projects: addedProjects,
        },
    }
}

async function getAddedUsers(startDate: string, endDate: string): Promise<UsageReport['details']['projects']> {
    const users = await userRepo.findBy({
        created: Between(startDate, endDate),
    })
    return users.map((user) => ({
        id: user.id,
        operation: 'add',
        timestamp: user.created,
    }))
}

async function getAddedProjects(startDate: string, endDate: string): Promise<UsageReport['details']['projects']> {
    const projects = await projectRepo.findBy({
        created: Between(startDate, endDate),
    })
    return projects.map((project) => ({
        id: project.id,
        operation: 'add',
        timestamp: project.created,
    }))
}


type UsageReport = {
    timestamp: string
    version: string
    licenseKey: string
    activeUsers: number
    addedUsers: number
    deletedUsers: number
    addedProjects: number
    deletedProjects: number
    activeProjects: number
    details: {
        users: {
            id: string
            operation: 'add' | 'delete'
            timestamp: string
        }[]
        projects: {
            id: string
            operation: 'add' | 'delete'
            timestamp: string
        }[]
    }
}
