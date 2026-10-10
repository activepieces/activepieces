import { EntitySchema } from 'typeorm';
import { ApIdSchema, BaseColumnSchemaPart } from '../../database/database-common';

export interface SynkraAgencyInvoice {
  id: string;
  created: string;
  updated: string;
  agencyId: string;
  invoiceNumber: string;
  periodStart: Date;
  periodEnd: Date;
  dueDate: Date;
  amountZar: number;
  agencyFeeZar: number;
  wholesaleTotalZar: number;
  lineItems: {
    description: string;
    quantity: number;
    unitZar: number;
    totalZar: number;
  }[];
  status: string; // 'pending' | 'paid' | 'overdue' | 'cancelled' | 'failed'
  paystackReference: string | null;
  paystackPaymentUrl: string | null;
  paidAt: Date | null;
  remindersSent: number;
  lastReminderAt: Date | null;
  pdfUrl: string | null;
  metadata: Record<string, unknown>;
}

export const SynkraAgencyInvoiceEntity = new EntitySchema<SynkraAgencyInvoice>({
  name: 'synkra_agency_invoice',
  columns: {
    ...BaseColumnSchemaPart,
    agencyId: ApIdSchema,
    invoiceNumber: { type: String, unique: true },
    periodStart: { type: 'timestamptz' },
    periodEnd: { type: 'timestamptz' },
    dueDate: { type: 'timestamptz' },
    amountZar: { type: 'int' },
    agencyFeeZar: { type: 'int' },
    wholesaleTotalZar: { type: 'int' },
    lineItems: { type: 'jsonb', default: [] },
    status: { type: String, default: 'pending' },
    paystackReference: { type: String, nullable: true },
    paystackPaymentUrl: { type: String, nullable: true },
    paidAt: { type: 'timestamptz', nullable: true },
    remindersSent: { type: 'int', default: 0 },
    lastReminderAt: { type: 'timestamptz', nullable: true },
    pdfUrl: { type: String, nullable: true },
    metadata: { type: 'jsonb', default: {} },
  },
  indices: [
    { name: 'idx_synkra_invoice_agency', columns: ['agencyId'] },
    { name: 'idx_synkra_invoice_status', columns: ['status'] },
    { name: 'idx_synkra_invoice_due', columns: ['dueDate'] },
  ],
});
