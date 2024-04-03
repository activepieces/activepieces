import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import dayjs from 'dayjs'
import { Between, Equal } from 'typeorm'
import { databaseConnection } from '../../database/database-connection'
import { flagService } from '../../flags/flag.service'
import { systemJobsSchedule } from '../../helper/system-jobs'
import { PlatformEntity } from '../../platform/platform.entity'
import { ProjectEntity } from '../../project/project-entity'
import { UserEntity } from '../../user/user-entity'
import { system, SystemProp } from '@activepieces/server-shared'
import { Platform } from '@activepieces/shared'

const userRepo = databaseConnection.getRepository(UserEntity)
const projectRepo = databaseConnection.getRepository(ProjectEntity)
const platformRepo = databaseConnection.getRepository(PlatformEntity)

export const usageTrackerModule: FastifyPluginAsyncTypebox = async () => {
    await systemJobsSchedule.upsertJob({
        job: {
            name: 'usage-report',
            data: {},
        },
        schedule: {
            type: 'repeated',
            cron: '*/59 23 * * *',
        },
        async handler(job) {
            const startOfDay = dayjs(job.timestamp).startOf('day').toISOString()
            const endOfDay = dayjs(job.timestamp).endOf('day').toISOString()
            const platforms = await platformRepo.find()
            const reports = []
            for (const platform of platforms) {
                if (flagService.isCloudPlatform(platform.id)) {
                    continue
                }
                const report = await constructUsageReport(platform, startOfDay, endOfDay)
                reports.push(report)
            }
            await sendUsageReport(reports)

        },
    })
}

async function sendUsageReport(reports: UsageReport[]): Promise<void> {
    await fetch('https://cloud.activepieces.com/api/v1/webhooks/ophE6T5QJBe7O3QT0sjvn', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(reports),
    })
}

async function constructUsageReport(platform: Platform, startDate: string, endDate: string): Promise<UsageReport> {
    const licenseKey = system.getOrThrow(SystemProp.LICENSE_KEY)
    const version = await flagService.getCurrentRelease()
    const addedProjects = await getAddedProjects(platform.id, startDate, endDate)
    const addedUsers = await getAddedUsers(platform.id, startDate, endDate)
    const activeProjects = await projectRepo.countBy({
        platformId: Equal(platform.id),
    })
    const activeUsers = await userRepo.countBy({
        platformId: Equal(platform.id),
    })
    return {
        platformId: platform.id,
        platformName: platform.name,
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

async function getAddedUsers(platformId: string, startDate: string, endDate: string): Promise<UsageReport['details']['projects']> {
    const users = await userRepo.findBy({
        platformId: Equal(platformId),
        created: Between(startDate, endDate),
    })
    return users.map((user) => ({
        id: user.id,
        operation: 'add',
        timestamp: user.created,
    }))
}

async function getAddedProjects(platformId: string, startDate: string, endDate: string): Promise<UsageReport['details']['projects']> {
    const projects = await projectRepo.findBy({
        created: Between(startDate, endDate),
        platformId: Equal(platformId),
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
    platformId: string
    platformName: string
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
