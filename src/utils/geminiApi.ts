import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AIContext } from '../types';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);

export class GeminiService {
  private model;

  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }

  async generateResponse(userMessage: string, context: AIContext): Promise<string> {
    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const fullPrompt = `${systemPrompt}\n\nUser Question: ${userMessage}`;

      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error('Failed to generate AI response. Please check your API key and try again.');
    }
  }

  async *generateStreamingResponse(userMessage: string, context: AIContext): AsyncGenerator<string, void, unknown> {
    try {
      const systemPrompt = this.buildSystemPrompt(context);
      const fullPrompt = `${systemPrompt}\n\nUser Question: ${userMessage}`;

      const result = await this.model.generateContentStream(fullPrompt);
      
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          yield chunkText;
        }
      }
    } catch (error) {
      console.error('Gemini Streaming API Error:', error);
      throw new Error('Failed to generate streaming AI response. Please check your API key and try again.');
    }
  }

  private buildSystemPrompt(context: AIContext): string {
    const { pdfText, currentPage, totalPages, selectedText } = context;
    
    let prompt = `You are an AI assistant helping users analyze and understand PDF documents. 

    Current Context:
    - Document has ${totalPages} pages
    - User is currently viewing page ${currentPage}
    - Available document content: ${pdfText.length > 0 ? 'Yes' : 'No'}

    `;

    if (selectedText) {
      prompt += `- User has selected text: "${selectedText}"\n`;
    }

    if (pdfText.length > 0) {
      const truncatedText = pdfText.length > 8000 
        ? pdfText.substring(0, 8000) + '...[truncated]'
        : pdfText;
      
      prompt += `\nDocument Content:\n${truncatedText}\n`;
    }

    prompt += `
    Instructions:
    - Answer questions about the PDF document based on the provided content
    - If asked to summarize, provide clear and concise summaries
    - If asked about specific pages, focus on content from those pages when available
    - If the document content is not available or insufficient, let the user know
    - Be helpful, accurate, and concise in your responses
    - If asked about something not in the document, clarify that your response is based on the available content

    Please provide helpful and accurate responses based on the document content provided above.`;

    return prompt;
  }

  isConfigured(): boolean {
    return API_KEY !== 'your-gemini-api-key-here' && API_KEY.length > 0;
  }
}

export const geminiService = new GeminiService();
