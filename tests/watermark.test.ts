import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { defaultWatermarkService } from '../packages/watermark/src';
import { PDFDocument, rgb } from 'pdf-lib';

describe('NETRA SHAKTI // Forensic Watermark Engine Tests', () => {
  const watermarkService = defaultWatermarkService;

  test('Watermark Payload: creates verifiable payload and encodes/decodes token with HMAC', () => {
    const documentId = 'DOC-TEST-01';
    const recipientId = 'RECIPIENT-01';
    const sessionId = 'SESS-TEST-01';

    const payload = watermarkService.createPayload(documentId, recipientId, sessionId);
    assert.match(payload.watermarkCode, /WM-NS-/);
    assert.ok(payload.checksum !== undefined);

    const token = watermarkService.core.encodePayload(payload);
    assert.ok(token.startsWith('NSWM$2.4.0$'));

    const decoded = watermarkService.core.decodePayload(token);
    assert.ok(decoded !== null);
    assert.equal(decoded?.watermarkCode, payload.watermarkCode);
    assert.equal(decoded?.documentId, documentId);
    assert.equal(decoded?.recipientId, recipientId);
    assert.equal(decoded?.sessionId, sessionId);
  });

  test('Watermark Payload: rejects tampered token string', () => {
    const payload = watermarkService.createPayload('DOC-A', 'USER-B', 'SESS-C');
    const token = watermarkService.core.encodePayload(payload);

    const parts = token.split('$');
    parts[2] = Buffer.from('{"tampered":true}').toString('base64');
    const tamperedToken = parts.join('$');

    const decoded = watermarkService.core.decodePayload(tamperedToken);
    assert.equal(decoded, null);
  });

  test('PDF Watermarking: embeds multi-layer forensic marks and recovers from PDF stream', async () => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([500, 700]);
    page.drawText('CONFIDENTIAL MILITARY DEFENSE DOCUMENT', { x: 50, y: 650 });
    const originalPdfBytes = Buffer.from(await pdfDoc.save());

    const payload = watermarkService.createPayload('DOC-PDF-01', 'USER-DEF-02', 'SESS-PDF-03');
    const watermarkedPdfBuffer = await watermarkService.embedInPdf(originalPdfBytes, payload);

    assert.ok(watermarkedPdfBuffer.length > originalPdfBytes.length);

    const extraction = await watermarkService.extractFromPdf(watermarkedPdfBuffer);
    assert.equal(extraction.extracted, true);
    assert.ok(extraction.confidence > 0.8);
    assert.equal(extraction.payload?.watermarkCode, payload.watermarkCode);
  });

  test('Robustness: extracts token from noisy raw binary memory stream', async () => {
    const payload = watermarkService.createPayload('DOC-IMG-01', 'USER-IMG-02', 'SESS-IMG-03');
    const token = watermarkService.core.encodePayload(payload);

    const noisyBuffer = Buffer.concat([
      Buffer.from('RANDOM_IMAGE_HEADER_BYTES_JPEG_JFIF_09823482394', 'utf8'),
      Buffer.from(token, 'utf8'),
      Buffer.from('TRAILING_SCAN_LINE_PIXEL_NOISE_23489234892', 'utf8')
    ]);

    const result = await watermarkService.extractFromImageOrBuffer(noisyBuffer);
    assert.equal(result.extracted, true);
    assert.equal(result.payload?.watermarkCode, payload.watermarkCode);
  });
});
