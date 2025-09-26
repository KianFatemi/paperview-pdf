import * as pdfjsLib from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';

export interface ExtractedPageText {
  pageNumber: number;
  text: string;
}

export class PDFTextExtractor {
  static async extractAllText(pdfDocument: pdfjsLib.PDFDocumentProxy): Promise<string> {
    try {
      const textPromises: Promise<string>[] = [];
      
      for (let i = 1; i <= pdfDocument.numPages; i++) {
        textPromises.push(this.extractPageText(pdfDocument, i));
      }
      
      const pageTexts = await Promise.all(textPromises);
      return pageTexts.join('\n\n--- Page Break ---\n\n');
    } catch (error) {
      console.error('Error extracting PDF text:', error);
      return '';
    }
  }

  static async extractPageText(pdfDocument: pdfjsLib.PDFDocumentProxy, pageNumber: number): Promise<string> {
    try {
      const page = await pdfDocument.getPage(pageNumber);
      const textContent = await page.getTextContent();
      
      return textContent.items
        .filter((item): item is TextItem => 'str' in item)
        .map(item => item.str)
        .join(' ')
        .trim();
    } catch (error) {
      console.error(`Error extracting text from page ${pageNumber}:`, error);
      return '';
    }
  }

  static async extractPageRange(
    pdfDocument: pdfjsLib.PDFDocumentProxy, 
    startPage: number, 
    endPage: number
  ): Promise<ExtractedPageText[]> {
    try {
      const results: ExtractedPageText[] = [];
      const actualEndPage = Math.min(endPage, pdfDocument.numPages);
      
      for (let pageNum = startPage; pageNum <= actualEndPage; pageNum++) {
        const text = await this.extractPageText(pdfDocument, pageNum);
        results.push({
          pageNumber: pageNum,
          text
        });
      }
      
      return results;
    } catch (error) {
      console.error('Error extracting page range text:', error);
      return [];
    }
  }

  static async extractRelevantContext(
    pdfDocument: pdfjsLib.PDFDocumentProxy,
    currentPage: number,
    contextRange: number = 2
  ): Promise<string> {
    try {
      const startPage = Math.max(1, currentPage - contextRange);
      const endPage = Math.min(pdfDocument.numPages, currentPage + contextRange);
      
      const pageTexts = await this.extractPageRange(pdfDocument, startPage, endPage);
      
      return pageTexts
        .map(({ pageNumber, text }) => `Page ${pageNumber}:\n${text}`)
        .join('\n\n');
    } catch (error) {
      console.error('Error extracting relevant context:', error);
      return '';
    }
  }
}
