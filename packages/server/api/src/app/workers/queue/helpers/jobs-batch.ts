import { isNil } from "@activepieces/shared";
import { Queue } from "bullmq";

export class JobsBatch<T> {
    private batchSize: number;

    constructor(batchSize: number = 100) {
        this.batchSize = batchSize;
    }

    async proccess(queue: Queue, batchHandler: BatchHandler<T>) {
        let start = 0;
        let end = this.batchSize - 1;

        while (true) {
            const jobs = await queue.getJobs(undefined, start, end);
            if (isNil(jobs) || jobs.length === 0) break;
            await batchHandler(jobs)
            start += this.batchSize;
            end += this.batchSize;
        }
    }
}

export type BatchHandler<T> = (items: T[]) => Promise<void>;

