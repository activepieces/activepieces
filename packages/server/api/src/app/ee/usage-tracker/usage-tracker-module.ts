import { AppSystemProp, apVersionUtil } from '@activepieces/server-shared'
import { Platform } from '@activepieces/shared'
import { FastifyPluginAsyncTypebox } from '@fastify/type-provider-typebox'
import dayjs from 'dayjs'
import { Between, Equal, IsNull, Not } from 'typeorm'
import { repoFactory } from '../../core/db/repo-factory'
import { flagService } from '../../flags/flag.service'
import { system } from '../../helper/system/system'
import { systemJobsSchedule } from '../../helper/system-jobs'
import { SystemJobData, SystemJobName } from '../../helper/system-jobs/common'
import { systemJobHandlers } from '../../helper/system-jobs/job-handlers'
import { PlatformEntity } from '../../platform/platform.entity'
import { ProjectEntity } from '../../project/project-entity'
import { UserEntity } from '../../user/user-entity'

const userRepo = repoFactory(UserEntity)
const projectRepo = repoFactory(ProjectEntity)
const platformRepo = repoFactory(PlatformEntity)

export const usageTrackerModule: FastifyPluginAsyncTypebox = async (app) => {
    systemJobHandlers.registerJobHandler(SystemJobName.USAGE_REPORT, sendUsageReport)
    await systemJobsSchedule(app.log).upsertJob({
        job: {
            name: SystemJobName.USAGE_REPORT,
            data: {},
        },
        schedule: {
            type: 'repeated',
            cron: '*/59 23 * * *',
        },
    })
}

async function sendUsageReport(job: SystemJobData<SystemJobName.USAGE_REPORT>): Promise<void> {
    const startOfDay = dayjs(job.timestamp).startOf('day').toISOString()
    const endOfDay = dayjs(job.timestamp).endOf('day').toISOString()
    const platforms = await platformRepo().find({
        where: {
            licenseKey: Not(IsNull()),
        },
    })
    const reports = []
    for (const platform of platforms) {
        if (flagService.isCloudPlatform(platform.id)) {
            continue
        }
        const report = await constructUsageReport(platform, startOfDay, endOfDay)
        reports.push(report)
    }
    await fetch('https://cloud.activepieces.com/api/v1/webhooks/ophE6T5QJBe7O3QT0sjvn', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(reports),
    })
}

async function constructUsageReport(platform: Platform, startDate: string, endDate: string): Promise<UsageReport> {
    const licenseKey = system.getOrThrow(AppSystemProp.LICENSE_KEY)
    const version = await apVersionUtil.getCurrentRelease()
    const addedProjects = await getAddedProjects(platform.id, startDate, endDate)
    const addedUsers = await getAddedUsers(platform.id, startDate, endDate)
    const activeProjects = await projectRepo().countBy({
        platformId: Equal(platform.id),
    })
    const activeUsers = await userRepo().countBy({
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
    const users = await userRepo().findBy({
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
    const projects = await projectRepo().findBy({
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