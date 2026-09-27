/**
 * PDF Extraction Service
 *
 * Accepts a PDF buffer, extracts and normalises text using pdfjs-dist
 * (Mozilla's official maintained PDF.js library).
 *
 * No AI is used here — this is a pure parsing concern.
 *
 * Library: pdfjs-dist (Mozilla PDF.js) — Node-compatible, actively maintained,
 * works directly from Uint8Array/Buffer, no temp files needed.
 *
 * Throws ApiError with a user-friendly message on:
 *   - unreadable / corrupt PDFs
 *   - image-only (scanned) PDFs with no extractable text
 *   - PDFs that are too small to be a meaningful resume
 */

import { ApiError } from '../../utils/ApiError.js';

// Minimum characters required to treat extraction as successful
const MIN_TEXT_LENGTH = 50;

/**
 * Validate PDF magic bytes (%PDF-)
 * @param {Buffer} buffer
 * @returns {boolean}
 */
export const hasPdfSignature = (buffer) => {
  if (!buffer || buffer.length < 5) return false;
  return buffer.slice(0, 5).toString('ascii') === '%PDF-';
};

/**
 * Normalise extracted raw text:
 *  - CRLF/CR → LF
 *  - null bytes removed
 *  - leading/trailing whitespace trimmed
 *  - 3+ consecutive blank lines collapsed to 2
 *  - 3+ consecutive spaces/tabs within a line collapsed to 1 space
 *
 * @param {string} raw
 * @returns {string}
 */
export const normalizeText = (raw) => {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\0/g, '')
    .replace(/[^\S\n]{3,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

/**
 * Extract and normalise text from a PDF buffer using pdfjs-dist.
 *
 * @param {Buffer} buffer - raw PDF bytes
 * @returns {Promise<string>} normalised text
 * @throws {ApiError} 400 if extraction fails or yields no useful text
 */
export const extractTextFromPdf = async (buffer) => {
  let pdfjsLib;
  try {
    // Dynamic import: keeps this ESM-safe and avoids top-level load cost
    pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
  } catch {
    throw new ApiError(500, 'PDF parsing library is unavailable');
  }

  let doc;
  try {
    const data = new Uint8Array(buffer);
    const loadingTask = pdfjsLib.getDocument({ data, verbosity: 0 });
    doc = await loadingTask.promise;
  } catch {
    throw new ApiError(
      400,
      "We couldn't extract readable text from this PDF. Please ensure the file is not password-protected or corrupted."
    );
  }

  const pageTexts = [];
  try {
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      // Join items: use newline for items that mark a new line, space otherwise
      let lastY = null;
      const pageText = content.items.map((item) => {
        if (item.str === undefined) return '';
        const y = item.transform ? item.transform[5] : null;
        const prefix = lastY !== null && y !== null && Math.abs(y - lastY) > 2 ? '\n' : '';
        lastY = y;
        return prefix + item.str;
      }).join('');
      pageTexts.push(pageText);
    }
  } catch {
    throw new ApiError(400, "We couldn't extract readable text from this PDF.");
  }

  const combinedText = pageTexts.join('\n\n');
  const text = normalizeText(combinedText);

  if (text.length < MIN_TEXT_LENGTH) {
    throw new ApiError(
      400,
      'This PDF appears to contain no extractable text. Please upload a text-based PDF resume. Scanned image PDFs are not currently supported.'
    );
  }

  return text;
};
