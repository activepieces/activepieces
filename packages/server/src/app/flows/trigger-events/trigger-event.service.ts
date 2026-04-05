import { apId } from '../../helper/apId';
import { buildPaginator } from '../../helper/pagination/build-paginator';
import { paginationHelper } from '../../helper/pagination/pagination-utils';
import { FlowId } from '../flow';
import { TriggerEventEntity } from './trigger-event.entity';
import {
    CreateTriggerEventRequest,
    Cursor,
    FlowRunStatus,
    PieceTrigger,
    PopulatedFlow,
    ProjectId,
    SeekPage,
    TriggerEvent,
    TriggerEventStatus,
    TriggerType,
} from '@activepieces/shared';
import { In, Repository, DataSource } from 'typeorm';

export const TRIGGER_EVENT_PAGINATION_SIZE = 10;

export class TriggerEventService {
    private triggerEventRepo: Repository<TriggerEventEntity>;

    constructor(dataSource: DataSource) {
        this.triggerEventRepo = dataSource.getRepository(TriggerEventEntity);
    }

    async save(triggerEvent: TriggerEvent): Promise<TriggerEvent> {
        return this.triggerEventRepo.save(triggerEvent);
    }

    async create(request: CreateTriggerEventRequest): Promise<TriggerEvent> {
        const newTriggerEvent = this.triggerEventRepo.create({
            id: apId(),
            flowId: request.flowId,
            payload: request.payload,
            status: request.status,
            projectId: request.projectId,
            rawRequest: request.rawRequest || null,
        });
        return this.triggerEventRepo.save(newTriggerEvent);
    }

    async list(
        flowId: FlowId,
        projectId: ProjectId,
        req: { cursorRequest?: Cursor },
        cursor: Cursor | null,
        limit: number,
    ): Promise<SeekPage<TriggerEvent>> {
        const query = this.triggerEventRepo
            .createQueryBuilder('trigger_event')
            .where({
                projectId,
                flowId,
            })
            .orderBy('created', 'DESC');
        const paginator = buildPaginator({
            entity: TriggerEventEntity,
            query,
            cursor,
            paginationMode: paginationHelper.get(req.cursorRequest),
        });
        const page = await paginator.paginate(limit);
        return page;
    }

    async getOne(id: string): Promise<TriggerEvent | null> {
        return await this.triggerEventRepo.findOneBy({ id });
    }

    async delete(id: string): Promise<void> {
        await this.triggerEventRepo.delete(id);
    }

    async findByFlowIdAndStatus(flowId: FlowId, status: TriggerEventStatus): Promise<TriggerEvent[]> {
        return await this.triggerEventRepo.findBy({ flowId, status });
    }
}