import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseColumnSchemaPart } from '../../helper/base-entity';
import { RawWebhookRequest, TriggerEvent, TriggerEventStatus } from '@activepieces/shared';
import { FlowEntity } from '../flow/flow.entity';

@Entity({
    name: 'trigger_event',
})
export class TriggerEventEntity extends BaseColumnSchemaPart implements TriggerEvent {
    @Index()
    @Column({
        nullable: false,
    })
    flowId: string;

    @ManyToOne(() => FlowEntity, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'flowId', referencedColumnName: 'id' })
    flow?: FlowEntity;

    @Column({
        type: 'jsonb',
        nullable: false,
    })
    payload: unknown;

    @Column({
        type: 'enum',
        enum: TriggerEventStatus,
        nullable: false,
    })
    status: TriggerEventStatus;

    @Column({
        nullable: false,
    })
    projectId: string;

    @Column({
        type: 'jsonb',
        nullable: true,
    })
    rawRequest!: RawWebhookRequest | null;
}