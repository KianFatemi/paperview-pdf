import { PDFDocument } from 'pdf-lib';
import type { PDFPage, FormField } from '../types';
import { saveFilledForm } from './formUtils';


export async function createPDFFromPages(
  originalPdfData: Uint8Array,
  pages: PDFPage[],
  options?: { uploadedSources?: Record<string, Uint8Array> }
): Promise<Uint8Array> {
  try {
    const originalPdf = await PDFDocument.load(new Uint8Array(originalPdfData.slice(0))); 
    const sourceCache: Record<string, PDFDocument> = { original: originalPdf } as any;
    if (options?.uploadedSources) {
      for (const [sourceId, data] of Object.entries(options.uploadedSources)) {
        const safeCopy = new Uint8Array(data.slice(0));
        sourceCache[sourceId] = await PDFDocument.load(safeCopy);
      }
    }
    
    const newPdf = await PDFDocument.create();

    for (const page of pages) {
      if (page.isDeleted) continue;

      const sourceId = page.sourceId ?? 'original';
      const srcDoc = sourceCache[sourceId];
      if (!srcDoc) {
        continue;
      }
      const [copiedPage] = await newPdf.copyPages(srcDoc, [page.originalPageNumber - 1]);
      newPdf.addPage(copiedPage);
    }

    const pdfBytes = await newPdf.save();
    return new Uint8Array(pdfBytes);
  } catch (error) {
    console.error('Error creating PDF from pages:', error);
    throw new Error('Failed to create PDF from pages');
  }
}

export async function insertPagesFromPDF(
  targetPdfData: Uint8Array,
  sourcePdfData: Uint8Array,
  insertAfterPageIndex: number = -1
): Promise<Uint8Array> {
  try {
    const targetPdf = await PDFDocument.load(targetPdfData);
    const sourcePdf = await PDFDocument.load(sourcePdfData);
    
    const sourcePageIndices = Array.from({ length: sourcePdf.getPageCount() }, (_, i) => i);
    const copiedPages = await targetPdf.copyPages(sourcePdf, sourcePageIndices);
    
    if (insertAfterPageIndex === -1) {
      copiedPages.forEach(page => targetPdf.addPage(page));
    } else {
      copiedPages.forEach((page, i) => {
        targetPdf.insertPage(insertAfterPageIndex + 1 + i, page);
      });
    }
    
    const pdfBytes = await targetPdf.save();
    return new Uint8Array(pdfBytes);
  } catch (error) {
    console.error('Error inserting pages from PDF:', error);
    throw new Error('Failed to insert pages from PDF');
  }
}


export async function removePagesFromPDF(
  pdfData: Uint8Array,
  pageIndicesToRemove: number[]
): Promise<Uint8Array> {
  try {
    const pdfDoc = await PDFDocument.load(pdfData);
    
    const sortedIndices = [...pageIndicesToRemove].sort((a, b) => b - a);
    
    sortedIndices.forEach(index => {
      pdfDoc.removePage(index);
    });
    
    const pdfBytes = await pdfDoc.save();
    return new Uint8Array(pdfBytes);
  } catch (error) {
    console.error('Error removing pages from PDF:', error);
    throw new Error('Failed to remove pages from PDF');
  }
}


export async function duplicatePagesInPDF(
  pdfData: Uint8Array,
  pageIndicesToDuplicate: number[]
): Promise<Uint8Array> {
  try {
    const pdfDoc = await PDFDocument.load(pdfData);
    
    const copiedPages = await pdfDoc.copyPages(pdfDoc, pageIndicesToDuplicate);
    
    pageIndicesToDuplicate.reverse().forEach((originalIndex, i) => {
      const duplicatedPage = copiedPages[pageIndicesToDuplicate.length - 1 - i];
      pdfDoc.insertPage(originalIndex + 1, duplicatedPage);
    });
    
    const pdfBytes = await pdfDoc.save();
    return new Uint8Array(pdfBytes);
  } catch (error) {
    console.error('Error duplicating pages in PDF:', error);
    throw new Error('Failed to duplicate pages in PDF');
  }
}

export async function reorderPagesInPDF(
  pdfData: Uint8Array,
  newPageOrder: number[]
): Promise<Uint8Array> {
  try {
    const originalPdf = await PDFDocument.load(pdfData);
    const newPdf = await PDFDocument.create();
    
    for (const pageIndex of newPageOrder) {
      const [copiedPage] = await newPdf.copyPages(originalPdf, [pageIndex]);
      newPdf.addPage(copiedPage);
    }
    
    const pdfBytes = await newPdf.save();
    return new Uint8Array(pdfBytes);
  } catch (error) {
    console.error('Error reordering pages in PDF:', error);
    throw new Error('Failed to reorder pages in PDF');
  }
}


export function downloadPDF(pdfData: Uint8Array, filename: string = 'modified-document.pdf'): void {
  try {
    const blob = new Blob([new Uint8Array(pdfData)], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw new Error('Failed to download PDF');
  }
}


export function validatePageArray(pages: PDFPage[]): { isValid: boolean; error?: string } {
  const activePagesCount = pages.filter(p => !p.isDeleted).length;
  
  if (activePagesCount === 0) {
    return { isValid: false, error: 'At least one page is required' };
  }
  
  const pageIds = pages.map(p => p.id);
  const uniquePageIds = new Set(pageIds);
  if (pageIds.length !== uniquePageIds.size) {
    return { isValid: false, error: 'Duplicate page IDs found' };
  }
  
  return { isValid: true };
}


export async function saveFilledFormPDF(
  pdfData: Uint8Array,
  formFields: FormField[]
): Promise<Uint8Array> {
  return saveFilledForm(pdfData, formFields);
}


export function downloadFilledFormPDF(
  pdfData: Uint8Array,
  formFields: FormField[],
  filename: string = 'filled-form.pdf'
): Promise<void> {
  return saveFilledForm(pdfData, formFields).then(filledPdfData => {
    downloadPDF(filledPdfData, filename);
  });
}
