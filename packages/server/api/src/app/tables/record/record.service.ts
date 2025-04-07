import { Readable } from 'stream'
import { AppSystemProp } from '@activepieces/server-shared'
import {
    ActivepiecesError,
    apId,
    chunk,
    CreateRecordsRequest,
    Cursor,
    ErrorCode,
    Field,
    GetFlowVersionForWorkerRequestType,
    ImportCsvRequestBody,
    isNil,
    PopulatedRecord,
    SeekPage,
    tableUtils,
    TableWebhookEventType,
    UpdateRecordRequest,
} from '@activepieces/shared'
import { parse } from 'csv-parse'
import { FastifyBaseLogger } from 'fastify'
import { EntityManager } from 'typeorm'
import { transaction } from '../../core/db/transaction'
import { system } from '../../helper/system/system'
import { webhookService } from '../../webhooks/webhook.service'
import { FieldEntity } from '../field/field.entity'
import { fieldService } from '../field/field.service'
import { tableService } from '../table/table.service'


export const recordService = {
    async create({
        request,
        projectId,
    }: CreateParams): Promise<PopulatedRecord[]> {
        await this.validateCount({ projectId, tableId: request.tableId }, request.records.length)
        const fields = await fieldService.getAll({projectId,tableId: request.tableId})
        const updatedFields = tableUtils.addValuesToFields({fields,records: request.records})
        await fieldService.bulkUpdate({projectId,tableId: request.tableId,fields: updatedFields})
        return tableUtils.getRecordsFromFields({
            fields: updatedFields,
            recordsIds: 'ALL',
            projectId,
            tableId: request.tableId,
        })
    },

    async list({
        tableId,
        projectId,
        //TODO: Implement or remove filters 
    }: ListParams): Promise<SeekPage<PopulatedRecord>> {
        const fields = await fieldService.getAll({
            tableId,
            projectId,
        })
        const data = tableUtils.getRecordsFromFields({
            fields,
            recordsIds: 'ALL',
            projectId,
            tableId,
        })
        return {
            data,
            next: null,
            previous: null,
        }
    },
    async update({
        id,
        projectId,
        request,
    }: UpdateParams): Promise<PopulatedRecord> {
        const { tableId } = request
        const fields = await fieldService.getAll({projectId,tableId})
        const updatedFields = tableUtils.updateRecord({
         fields,
         cells: request.cells,
         id
        })
        await fieldService.bulkUpdate({projectId,tableId,fields: updatedFields})
        return tableUtils.getRecordsFromFields({
         fields: updatedFields,
         recordsIds: [id],
         projectId,
         tableId,
        })[0]
    },

    async delete({
        ids,
        projectId,
        tableId
    }: DeleteParams): Promise<PopulatedRecord[]> {
        if (ids.length === 0) {
            return []
        }

        const fields = await fieldService.getAll({
            tableId,
            projectId,
        })
        if(fields.length === 0){
            return []
        }

      const updatedFields = fields.map((field)=>{
        return {
            ...field,
            cells: field.cells.filter((cell)=> !ids.includes(cell.recordId)),
        }
      })
      transaction(async (entityManager: EntityManager)=>{
         // Process updates in chunks to avoid query size limitations
         const chunkSize = 100
         for (let i = 0; i < updatedFields.length; i += chunkSize) {
             const chunk = updatedFields.slice(i, i + chunkSize)
             const chunkIds = chunk.map(f => f.id)
 
             await entityManager
                 .createQueryBuilder()
                 .update(FieldEntity)
                 .set(
                     updatedFields
                 )
                 .where('id IN (:...ids)', { ids: chunkIds })
                 .andWhere('projectId = :projectId', { projectId })
                 .andWhere('tableId = :tableId', { tableId })
                 .execute()
         }
      })
    return tableUtils.getRecordsFromFields({
        fields,
        recordsIds: ids,
        projectId,
        tableId,
    })
    
    },

    async triggerWebhooks({
        projectId,
        tableId,
        eventType,
        data,
        logger,
        authorization,
    }: TriggerWebhooksParams): Promise<void> {
        const webhooks = await tableService.getWebhooks({
            projectId,
            id: tableId,
            events: [eventType],
        })

        if (webhooks.length === 0) {
            return
        }
        await Promise.all(webhooks.map((webhook) => {
            return webhookService.handleWebhook({
                async: true,
                flowId: webhook.flowId,
                flowVersionToRun: GetFlowVersionForWorkerRequestType.LOCKED,
                saveSampleData: false,
                data: async (_projectId: string) => ({
                    method: 'POST',
                    headers: {
                        authorization,
                    },
                    body: data,
                    queryParams: {},
                }),
                logger,
            })
        }))
    },

    async count({ projectId, tableId }: CountParams): Promise<number> {
        const fields = await fieldService.getAll({projectId,tableId})
        return fields[0].cells.length
    },
    async validateCount(params: CountParams, insertCount: number): Promise<void> {
        const countRes = await this.count(params)
        if (countRes + insertCount > system.getNumberOrThrow(AppSystemProp.MAX_RECORDS_PER_TABLE)) {
            throw new ActivepiecesError({
                code: ErrorCode.VALIDATION,
                params: { message: `Max records per table reached: ${system.getNumberOrThrow(AppSystemProp.MAX_RECORDS_PER_TABLE)}`,
                },
            })
        }
    },
    async importCsv({
        projectId,
        tableId,
        request,
    }: ImportCsvParams): Promise<PopulatedRecord[]> {
        // validate table existence 
        const count = await this.count({ projectId, tableId })
        await tableService.getById({ projectId, id: tableId })
        const fields = await fieldService.getAll({ projectId, tableId })
        const inputStream = Readable.from(request.file.data as Buffer).setEncoding('utf-8')
        const parser = inputStream.pipe(parse({
            skip_empty_lines: true,
            from_line: request.skipFirstRow ? 2 : 1,
        }))
        const records: { value: string, fieldId: string }[][] = []
        for await (const row of parser) {
            const record: { value: string, fieldId: string }[] = fields.reduce((acc, field, idx) => {
                acc.push({ value: row[idx], fieldId: field.id })                
                return acc
            }, [] as { value: string, fieldId: string }[])
            records.push(record)
        }
        const batches = chunk(records, 100)
        const results: PopulatedRecord[] = []
        let processedCount = 0
        const maxRecordsPerTable = system.getNumberOrThrow(AppSystemProp.MAX_RECORDS_PER_TABLE);
        for (const batch of batches) {
            const batchToProcess = processedCount + batch.length + count <= maxRecordsPerTable ? batch: batch.slice(0, maxRecordsPerTable - processedCount - count)
            if(batchToProcess.length > 0){
                const res = await this.create({
                    projectId,
                        request: {
                            records: batchToProcess,
                            tableId,
                        },
                    })
                results.push(...res)
                processedCount += batchToProcess.length
            }
        }
        return results
    },
}

type CreateParams = {
    request: CreateRecordsRequest
    projectId: string
}

type ListParams = {
    tableId: string
    projectId: string
    cursorRequest: Cursor | null
    limit: number
}



type UpdateParams = {
    id: string
    projectId: string
    request: UpdateRecordRequest
}

type DeleteParams = {
    ids: string[]
    projectId: string
    tableId: string
}

type TriggerWebhooksParams = {
    projectId: string
    tableId: string
    eventType: TableWebhookEventType
    data: Record<string, unknown>
    logger: FastifyBaseLogger
    authorization: string
}



type CountParams = {
    projectId: string
    tableId: string
}

type ImportCsvParams = {
    projectId: string
    tableId: string
    request: ImportCsvRequestBody
}

