import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker if available
try {
  if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    // Set standard cdnjs worker path or fallback
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
  }
} catch {
  // ignore worker setup errors
}

export async function extractTextFromFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();

  // Plain text formats
  if (
    fileName.endsWith('.txt') ||
    fileName.endsWith('.text') ||
    fileName.endsWith('.md') ||
    fileName.endsWith('.csv') ||
    file.type === 'text/plain'
  ) {
    try {
      const content = await file.text();
      if (!content || !content.trim()) {
        throw new Error('File appears to be empty.');
      }
      return content.trim();
    } catch (err: any) {
      throw new Error(err?.message || 'Unable to read text file.');
    }
  }

  // Word Document (.docx)
  if (
    fileName.endsWith('.docx') ||
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const text = result.value.trim();
      if (!text) {
        throw new Error('No readable text found in this DOCX file.');
      }
      return text;
    } catch (err: any) {
      throw new Error(err?.message || 'Unable to read DOCX document.');
    }
  }

  // PDF Document
  if (fileName.endsWith('.pdf') || file.type === 'application/pdf') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdf = await loadingTask.promise;
      let fullText = '';

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageItems = textContent.items
          .map((item: any) => item.str || '')
          .join(' ');
        fullText += `[Page ${pageNum}]\n${pageItems}\n\n`;
      }

      const trimmed = fullText.trim();
      if (!trimmed) {
        throw new Error('No readable text detected in this PDF.');
      }
      return trimmed;
    } catch (err: any) {
      throw new Error(err?.message || 'Unable to read PDF document.');
    }
  }

  // Fallback attempt with text reader
  try {
    const fallbackText = await file.text();
    if (fallbackText && fallbackText.trim().length > 10) {
      return fallbackText.trim();
    }
  } catch {
    // ignore
  }

  throw new Error('Unsupported file type. Please upload a .txt, .docx, or .pdf file, or paste text manually.');
}
