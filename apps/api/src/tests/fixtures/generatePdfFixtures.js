/**
 * generatePdfFixtures.js
 * Creates minimal PDF byte buffers for testing without committing binary files.
 * All content is synthetic — no real personal data.
 */

/**
 * Minimal valid text PDF containing a synthetic resume.
 * %PDF-1.4 header, single page with BT/ET text block.
 */
export const makeValidResumePdf = () => {
  const text = `John Doe - Software Engineer
Email: john.doe@example.com | GitHub: github.com/johndoe

SKILLS
Programming Languages: JavaScript, TypeScript, Python
Frameworks: React, Node.js, Express
Databases: MongoDB, PostgreSQL
Tools: Git, Docker, CI/CD pipelines

EXPERIENCE
Software Engineer - Acme Corp (2022-2024)
  - Built RESTful APIs using Node.js and Express
  - Developed React frontend components and integrated them with REST APIs
  - Deployed applications to AWS using Docker containers

EDUCATION
B.Sc. Computer Science - State University (2018-2022)

PROJECTS
InterviewIQ - AI-powered mock interview platform
  - Full-stack MERN application with AI-driven feedback`;

  // Build a minimal but structurally valid PDF using raw content streams
  const content = `BT /F1 12 Tf 50 750 Td (${text.replace(/[()\\]/g, '\\$&').replace(/\n/g, ') Tj T* (')}) Tj ET`;
  const resourceDict = `<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >>`;

  const objects = [
    `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj`,
    `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj`,
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources ${resourceDict} >>\nendobj`,
    `4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj`,
  ];

  const header = `%PDF-1.4\n`;
  let body = header;
  const offsets = [];
  for (const obj of objects) {
    offsets.push(body.length);
    body += obj + '\n';
  }

  const xrefOffset = body.length;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) {
    xref += String(off).padStart(10, '0') + ' 00000 n \n';
  }
  const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(body + xref + trailer, 'utf8');
};

/**
 * A buffer that looks like a text file, not a PDF.
 * Starts with "FAKE" instead of "%PDF-".
 */
export const makeFakePdfBuffer = () =>
  Buffer.from('FAKE this is not a real PDF file, just random text bytes to simulate a renamed file.', 'utf8');

/**
 * A buffer that starts with %PDF- but has no parseable content stream.
 * Simulates a corrupt/unreadable PDF.
 */
export const makeCorruptPdfBuffer = () =>
  Buffer.from('%PDF-1.4\n% this PDF has no valid content stream and cannot be parsed\n1 0 obj\n<<\nendobj\n%%EOF', 'utf8');

/**
 * A buffer that starts with %PDF- but whose text content is too short.
 * Simulates a nearly-empty or image-only PDF.
 */
export const makeEmptyPdfBuffer = () => {
  const content = `BT /F1 12 Tf 50 750 Td (Hi) Tj ET`;
  const resourceDict = `<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >>`;
  const objects = [
    `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj`,
    `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj`,
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources ${resourceDict} >>\nendobj`,
    `4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj`,
  ];
  const header = `%PDF-1.4\n`;
  let body = header;
  const offsets = [];
  for (const obj of objects) { offsets.push(body.length); body += obj + '\n'; }
  const xrefOffset = body.length;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) xref += String(off).padStart(10, '0') + ' 00000 n \n';
  return Buffer.from(body + xref + `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`, 'utf8');
};

/**
 * Generate an oversized buffer (> 5MB) that starts with PDF bytes,
 * without committing a large binary to the repo.
 */
export const makeOversizedPdfBuffer = () => {
  const filler = Buffer.alloc(6 * 1024 * 1024, 0x41); // 6 MB of 'A'
  const header = Buffer.from('%PDF-1.4\n', 'utf8');
  return Buffer.concat([header, filler]);
};
