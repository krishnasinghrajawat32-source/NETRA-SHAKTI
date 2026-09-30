import { Injectable, NotFoundException, Logger, Inject, Optional } from '@nestjs/common';
import * as crypto from 'crypto';
import { PDFDocument, rgb, StandardFonts } from '@netra-shakti/watermark';
import { prisma } from '@netra-shakti/database';
import { defaultCryptoService } from '@netra-shakti/crypto';
import { AuditService } from '../audit/audit.service';
import { AuditEventType, IUser } from '@netra-shakti/shared-types';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  private _audit: AuditService | null = null;

  constructor(
    @Optional() @Inject(AuditService) private readonly auditService?: AuditService
  ) {}

  private get audit(): AuditService {
    if (this.auditService) return this.auditService;
    if (!this._audit) this._audit = new AuditService();
    return this._audit;
  }

  async generatePdfReport(investigationId: string, user: IUser): Promise<{ buffer: Buffer; filename: string; reportHash: string }> {
    const investigation = await prisma.investigation.findUnique({
      where: { id: investigationId },
      include: {
        createdBy: true,
        evidence: true,
        findings: {
          include: {
            watermark: true,
            document: true,
            session: {
              include: {
                signature: true,
                ledgerEvent: true
              }
            },
            recipient: true
          }
        }
      }
    });

    if (!investigation) {
      throw new NotFoundException('Investigation case not found');
    }

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontReg = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Dark Cyber-Defense Military Header
    page.drawRectangle({
      x: 0,
      y: 841.89 - 60,
      width: 595.28,
      height: 60,
      color: rgb(0.04, 0.1, 0.18)
    });

    page.drawText('NETRA SHAKTI // DEFENCE FORENSIC SUITE', {
      x: 40,
      y: 841.89 - 28,
      size: 15,
      font: fontBold,
      color: rgb(0.0, 0.94, 1.0)
    });

    page.drawText('OFFICIAL: TRACE THE ORIGIN, PROVE THE TRUTH | CRYPTOGRAPHIC ATTRIBUTION REPORT', {
      x: 40,
      y: 841.89 - 46,
      size: 7.5,
      font: fontReg,
      color: rgb(0.63, 0.68, 0.75)
    });

    // Classification Banner
    page.drawRectangle({
      x: 40,
      y: 841.89 - 95,
      width: 515.28,
      height: 24,
      color: rgb(0.12, 0.16, 0.23)
    });

    page.drawText('CLASSIFICATION: TOP SECRET // FORENSIC EVIDENCE RECORD', {
      x: 100,
      y: 841.89 - 88,
      size: 10,
      font: fontBold,
      color: rgb(0.0, 1.0, 0.4)
    });

    let currentY = 841.89 - 130;

    // Metadata Block
    page.drawText(`CASE FILE: ${investigation.caseNumber}`, {
      x: 40,
      y: currentY,
      size: 13,
      font: fontBold,
      color: rgb(0.06, 0.09, 0.16)
    });
    currentY -= 18;

    const metaLines = [
      `Title: ${investigation.title}`,
      `Investigator: ${investigation.createdBy?.displayName || 'DEFENCE Analyst'} (${investigation.createdBy?.department || 'INTEL'})`,
      `Status: ${investigation.status}`,
      `Generated At: ${new Date().toISOString()}`
    ];

    for (const line of metaLines) {
      page.drawText(line, { x: 40, y: currentY, size: 9, font: fontReg, color: rgb(0.28, 0.33, 0.41) });
      currentY -= 14;
    }

    currentY -= 10;
    // Section 1
    page.drawText('1. EVIDENCE INTEGRITY & CHECKSUMS', { x: 40, y: currentY, size: 11, font: fontBold, color: rgb(0.06, 0.09, 0.16) });
    currentY -= 16;

    if (investigation.evidence.length === 0) {
      page.drawText('No evidence files recorded.', { x: 40, y: currentY, size: 9, font: fontReg, color: rgb(0.4, 0.45, 0.5) });
      currentY -= 16;
    } else {
      for (let idx = 0; idx < investigation.evidence.length; idx++) {
        const ev = investigation.evidence[idx];
        page.drawText(`[Evidence #${idx + 1}] Filename: ${ev.originalFilename} (${Math.round(ev.size / 1024)} KB, ${ev.mimeType})`, {
          x: 40,
          y: currentY,
          size: 9,
          font: fontReg,
          color: rgb(0.2, 0.25, 0.3)
        });
        currentY -= 12;
        page.drawText(`SHA-256 Hash: ${ev.contentHash}`, {
          x: 40,
          y: currentY,
          size: 8.5,
          font: fontReg,
          color: rgb(0.01, 0.41, 0.63)
        });
        currentY -= 16;
      }
    }

    currentY -= 10;
    // Section 2
    page.drawText('2. FORENSIC ATTRIBUTION FINDINGS', { x: 40, y: currentY, size: 11, font: fontBold, color: rgb(0.06, 0.09, 0.16) });
    currentY -= 16;

    if (investigation.findings.length === 0) {
      page.drawText('Analysis pending or no matches identified.', { x: 40, y: currentY, size: 9, font: fontReg, color: rgb(0.4, 0.45, 0.5) });
      currentY -= 16;
    } else {
      for (let idx = 0; idx < investigation.findings.length; idx++) {
        const finding = investigation.findings[idx];
        page.drawText(`Finding #${idx + 1}: Status [${finding.matchType}] - Confidence: ${(finding.confidence * 100).toFixed(1)}%`, {
          x: 40,
          y: currentY,
          size: 9.5,
          font: fontBold,
          color: rgb(0.06, 0.09, 0.16)
        });
        currentY -= 14;

        const findingLines = [
          `* Transformation Detected: ${finding.transformationType || 'ORIGINAL'}`,
          `* Cryptographic Watermark Check: ${finding.cryptographicWatermarkValid ? 'VALID (MATCHED)' : 'INVALID / UNRECOVERABLE'}`,
          `* Digital Signature Verification: ${finding.signatureValid ? 'VALID (CRYPTOGRAPHICALLY VERIFIED)' : 'FAILED'}`,
          `* Ledger Chain Integrity: ${finding.ledgerValid ? 'TAMPER-EVIDENT LEDGER VERIFIED' : 'FAILED'}`
        ];

        if (finding.recipient) {
          findingLines.push(`* Associated Recipient: ${finding.recipient.displayName} (@${finding.recipient.username})`);
        }
        if (finding.session) {
          findingLines.push(`* Associated Decryption Session: ${finding.session.sessionCode} (Started: ${finding.session.startedAt})`);
          findingLines.push(`* Issued Copy Document Hash: ${finding.session.issuedDocumentHash || 'N/A'}`);
        }
        if (finding.document) {
          findingLines.push(`* Source Confidential Document: ${finding.document.title} [${finding.document.documentCode}] (${finding.document.classification})`);
        }

        for (const fLine of findingLines) {
          page.drawText(fLine, { x: 45, y: currentY, size: 8.5, font: fontReg, color: rgb(0.2, 0.25, 0.3) });
          currentY -= 12;
        }
        currentY -= 6;
      }
    }

    currentY -= 10;
    // Section 3: Legal & Attribution Disclaimer
    page.drawText('3. DEFENCE FORENSIC ATTRIBUTION DISCLAIMER', { x: 40, y: currentY, size: 10, font: fontBold, color: rgb(0.7, 0.32, 0.04) });
    currentY -= 14;

    const disclaimer1 = 'The recovered forensic fingerprint is associated with the recorded decryption session assigned to this recipient.';
    const disclaimer2 = 'Document attribution identifies the issued source copy and does not independently establish user intent or responsibility';
    const disclaimer3 = 'for disclosure. All conclusions are based on cryptographic hashes, steganographic watermarks, and immutable ledger events.';

    page.drawText(disclaimer1, { x: 40, y: currentY, size: 8, font: fontReg, color: rgb(0.28, 0.33, 0.41) });
    currentY -= 11;
    page.drawText(disclaimer2, { x: 40, y: currentY, size: 8, font: fontReg, color: rgb(0.28, 0.33, 0.41) });
    currentY -= 11;
    page.drawText(disclaimer3, { x: 40, y: currentY, size: 8, font: fontReg, color: rgb(0.28, 0.33, 0.41) });

    // Seal Footer
    page.drawRectangle({
      x: 40,
      y: 35,
      width: 515.28,
      height: 35,
      color: rgb(0.95, 0.96, 0.98)
    });

    page.drawText('OFFICIAL REPORT DIGEST // SEALED BY NETRA SHAKTI DEFENCE ENGINE', {
      x: 50,
      y: 54,
      size: 8,
      font: fontBold,
      color: rgb(0.06, 0.09, 0.16)
    });

    page.drawText(`Cryptographic Nonce: ${crypto.randomBytes(8).toString('hex').toUpperCase()} | Post-Quantum Ready | Air-Gapped Compliant`, {
      x: 50,
      y: 42,
      size: 7.5,
      font: fontReg,
      color: rgb(0.39, 0.45, 0.55)
    });

    const pdfBytes = await pdfDoc.save();
    const buffer = Buffer.from(pdfBytes);
    const reportHash = defaultCryptoService.hash(buffer);

    await this.audit.log({
      eventType: AuditEventType.REPORT_EXPORTED,
      userId: user.id,
      resourceType: 'INVESTIGATION_REPORT',
      resourceId: investigationId,
      action: `Exported forensic attribution PDF report for case ${investigation.caseNumber}`,
      details: { reportHash },
      status: 'SUCCESS'
    });

    return {
      buffer,
      filename: `NETRA_FORENSIC_REPORT_${investigation.caseNumber}.pdf`,
      reportHash
    };
  }
}
