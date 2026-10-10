import { FastifyBaseLogger } from 'fastify';
import PDFDocument from 'pdfkit';
import { SynkraAgency, SynkraAgencyEntity } from './agency.entity';
import { SynkraAgencyInvoice } from './invoice.entity';
import { repoFactory } from '../../core/db/repo-factory';
import { userService } from '../../user/user-service';
import { userIdentityService } from '../../authentication/user-identity/user-identity-service';

const agencyRepo = repoFactory<SynkraAgency>(SynkraAgencyEntity);

const BRAND_GREEN = '#5DD62C';
const TEXT_DARK = '#0a0a0a';
const TEXT_MUTED = '#666666';
const TEXT_LIGHT = '#999999';
const DIVIDER = '#e5e5e5';

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatZar(amount: number): string {
  return `R${amount.toLocaleString('en-ZA')}`;
}

export const synkraAgencyInvoicePdfService = (log: FastifyBaseLogger) => ({
  /**
   * Generates a PDF invoice from Synkra to the Agency.
   * Returns a Node Buffer ready to stream.
   */
  async generate(invoice: SynkraAgencyInvoice): Promise<Buffer> {
    const agency = await agencyRepo().findOneBy({ id: invoice.agencyId });
    if (!agency) throw new Error('Agency not found');

    // Best-effort owner info.
    let agencyEmail = '';
    try {
      const owner = await userService(log).getOneOrFail({ id: agency.ownerUserId });
      const ident = await userIdentityService(log).getOneOrFail({ id: owner.identityId });
      agencyEmail = ident.email ?? '';
    } catch { /* non-blocking */ }

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50,
          info: {
            Title: `Invoice ${invoice.invoiceNumber}`,
            Author: 'Synkra Flow',
            Subject: 'Agency invoice',
          },
        });

        const chunks: Buffer[] = [];
        doc.on('data', (c) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const pageWidth = doc.page.width;
        const margin = 50;
        const contentWidth = pageWidth - margin * 2;

        // ────────────────────────────────────────────────────
        // Header — Synkra branding
        // ────────────────────────────────────────────────────
        doc
          .font('Helvetica-Bold')
          .fontSize(22)
          .fillColor(TEXT_DARK)
          .text('Synkra Flow', margin, margin);

        doc
          .font('Helvetica')
          .fontSize(9)
          .fillColor(TEXT_MUTED)
          .text('synkra.co.za · hello@synkra.co.za', margin, margin + 28)
          .text('Johannesburg, South Africa');

        // "INVOICE" heading on right
        doc
          .font('Helvetica-Bold')
          .fontSize(28)
          .fillColor(BRAND_GREEN)
          .text('INVOICE', margin, margin, { align: 'right', width: contentWidth });

        // ────────────────────────────────────────────────────
        // Green divider
        // ────────────────────────────────────────────────────
        doc
          .moveTo(margin, margin + 70)
          .lineTo(pageWidth - margin, margin + 70)
          .lineWidth(2)
          .strokeColor(BRAND_GREEN)
          .stroke();

        // ────────────────────────────────────────────────────
        // Bill to + Invoice info (two columns)
        // ────────────────────────────────────────────────────
        const infoTop = margin + 90;

        // Left: Bill to
        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor(TEXT_MUTED)
          .text('BILL TO', margin, infoTop);

        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .fillColor(TEXT_DARK)
          .text(agency.name || 'Agency', margin, infoTop + 16);

        if (agencyEmail) {
          doc
            .font('Helvetica')
            .fontSize(10)
            .fillColor(TEXT_MUTED)
            .text(agencyEmail, margin, infoTop + 32);
        }

        // Right: Invoice details
        const rightX = margin + contentWidth / 2;

        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor(TEXT_MUTED)
          .text('INVOICE NUMBER', rightX, infoTop)
          .text('ISSUE DATE', rightX, infoTop + 14)
          .text('DUE DATE', rightX, infoTop + 28)
          .text('PERIOD', rightX, infoTop + 42);

        doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor(TEXT_DARK)
          .text(invoice.invoiceNumber, rightX + 110, infoTop, { width: contentWidth / 2 - 110 })
          .text(formatDate(invoice.created), rightX + 110, infoTop + 14)
          .text(formatDate(invoice.dueDate), rightX + 110, infoTop + 28)
          .text(
            `${formatDate(invoice.periodStart)} – ${formatDate(invoice.periodEnd)}`,
            rightX + 110,
            infoTop + 42,
          );

        // ────────────────────────────────────────────────────
        // Line items table
        // ────────────────────────────────────────────────────
        const tableTop = infoTop + 100;
        const colDesc = margin;
        const colQty = margin + contentWidth - 220;
        const colUnit = margin + contentWidth - 150;
        const colTotal = margin + contentWidth - 70;

        // Table header
        doc
          .font('Helvetica-Bold')
          .fontSize(9)
          .fillColor(TEXT_MUTED)
          .text('DESCRIPTION', colDesc, tableTop)
          .text('QTY', colQty, tableTop, { width: 50, align: 'right' })
          .text('UNIT', colUnit, tableTop, { width: 70, align: 'right' })
          .text('TOTAL', colTotal, tableTop, { width: 70, align: 'right' });

        // Header divider
        doc
          .moveTo(margin, tableTop + 16)
          .lineTo(pageWidth - margin, tableTop + 16)
          .lineWidth(0.5)
          .strokeColor(DIVIDER)
          .stroke();

        // Rows
        let rowY = tableTop + 26;
        doc.font('Helvetica').fontSize(10).fillColor(TEXT_DARK);

        for (const li of invoice.lineItems) {
          doc.text(li.description, colDesc, rowY, {
            width: contentWidth - 240,
            ellipsis: true,
          });
          doc.text(String(li.quantity), colQty, rowY, { width: 50, align: 'right' });
          doc.text(formatZar(li.unitZar), colUnit, rowY, { width: 70, align: 'right' });
          doc.text(formatZar(li.totalZar), colTotal, rowY, { width: 70, align: 'right' });

          rowY += 22;

          doc
            .moveTo(margin, rowY - 6)
            .lineTo(pageWidth - margin, rowY - 6)
            .lineWidth(0.3)
            .strokeColor(DIVIDER)
            .stroke();
        }

        // ────────────────────────────────────────────────────
        // Total block
        // ────────────────────────────────────────────────────
        const totalY = rowY + 20;

        doc
          .moveTo(colUnit - 20, totalY)
          .lineTo(pageWidth - margin, totalY)
          .lineWidth(1)
          .strokeColor(BRAND_GREEN)
          .stroke();

        doc
          .font('Helvetica-Bold')
          .fontSize(12)
          .fillColor(TEXT_DARK)
          .text('TOTAL', colUnit - 20, totalY + 12, { width: 90, align: 'right' });

        doc
          .font('Helvetica-Bold')
          .fontSize(16)
          .fillColor(BRAND_GREEN)
          .text(formatZar(invoice.amountZar), colTotal, totalY + 8, {
            width: 70,
            align: 'right',
          });

        // ────────────────────────────────────────────────────
        // Payment link (if present)
        // ────────────────────────────────────────────────────
        if (invoice.paystackPaymentUrl) {
          const payY = totalY + 60;
          doc
            .font('Helvetica-Bold')
            .fontSize(10)
            .fillColor(TEXT_DARK)
            .text('Pay online:', margin, payY);

          doc
            .font('Helvetica')
            .fontSize(9)
            .fillColor('#0a5cb8')
            .text(invoice.paystackPaymentUrl, margin, payY + 14, {
              width: contentWidth,
              link: invoice.paystackPaymentUrl,
              underline: true,
            });
        }

        // ────────────────────────────────────────────────────
        // Footer
        // ────────────────────────────────────────────────────
        const footerY = doc.page.height - 80;

        doc
          .moveTo(margin, footerY)
          .lineTo(pageWidth - margin, footerY)
          .lineWidth(0.5)
          .strokeColor(DIVIDER)
          .stroke();

        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor(TEXT_LIGHT)
          .text(
            'Payment terms: 7-day grace period from issue date. Client environments pause if the invoice remains unpaid past the due date.',
            margin,
            footerY + 12,
            { width: contentWidth, align: 'center' },
          )
          .text(
            'Synkra Technologies · synkra.co.za · This invoice is issued by Synkra to the agency.',
            margin,
            footerY + 30,
            { width: contentWidth, align: 'center' },
          );

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  },
});
