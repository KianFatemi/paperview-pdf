import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import AIChatBox from './AIChatBox';
import { geminiService } from '../utils/geminiApi';
import { PDFTextExtractor } from '../utils/pdfTextExtractor';
import type { ChatMessage, AIContext } from '../types';
import * as pdfjsLib from 'pdfjs-dist';

interface AISidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  pdfDocument: pdfjsLib.PDFDocumentProxy | null;
  currentPage: number;
  selectedText?: string;
}

const AISidePanel: React.FC<AISidePanelProps> = ({
  isOpen,
  onClose,
  pdfDocument,
  currentPage,
  selectedText
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pdfText, setPdfText] = useState<string>('');
  const [isExtractingText, setIsExtractingText] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfigured = geminiService.isConfigured();

  useEffect(() => {
    if (!pdfDocument) {
      setPdfText('');
      return;
    }

    const extractText = async () => {
      setIsExtractingText(true);
      setError(null);
      try {
        const contextText = await PDFTextExtractor.extractRelevantContext(pdfDocument, currentPage, 3);
        setPdfText(contextText);
      } catch (err) {
        console.error('Failed to extract PDF text:', err);
        setError('Failed to extract text from PDF');
        setPdfText('');
      } finally {
        setIsExtractingText(false);
      }
    };

    extractText();
  }, [pdfDocument, currentPage]);

  useEffect(() => {
    if (pdfDocument) {
      setMessages([]);
      setError(null);
    }
  }, [pdfDocument]);

  const handleSendMessage = useCallback(async (userMessage: string) => {
    if (!isConfigured) {
      setError('Gemini API key not configured. Please add your API key to use the AI assistant.');
      return;
    }

    const userMessageObj: ChatMessage = {
      id: uuidv4(),
      type: 'user',
      content: userMessage,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMessageObj]);
    setIsLoading(true);
    setError(null);

    try {
      const context: AIContext = {
        pdfText,
        currentPage,
        totalPages: pdfDocument?.numPages || 0,
        selectedText,
      };

      const assistantMessageId = uuidv4();
      const assistantMessage: ChatMessage = {
        id: assistantMessageId,
        type: 'assistant',
        content: '',
        timestamp: Date.now(),
        isStreaming: true,
      };

      setMessages(prev => [...prev, assistantMessage]);

      let fullResponse = '';
      
      for await (const chunk of geminiService.generateStreamingResponse(userMessage, context)) {
        fullResponse += chunk;
        setMessages(prev => 
          prev.map(msg => 
            msg.id === assistantMessageId 
              ? { ...msg, content: fullResponse, isStreaming: true }
              : msg
          )
        );
      }

      setMessages(prev => 
        prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, isStreaming: false }
            : msg
        )
      );

    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to get AI response';
      setError(errorMessage);
      
      setMessages(prev => prev.filter(msg => msg.type === 'user' || msg.content.length > 0));
    } finally {
      setIsLoading(false);
    }
  }, [isConfigured, pdfText, currentPage, pdfDocument, selectedText]);

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-gray-800 border-l border-gray-600 shadow-2xl z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-600">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <svg 
              className="w-5 h-5 text-blue-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" 
              />
            </svg>
            <h2 className="text-lg font-semibold text-white">AI Assistant</h2>
          </div>
          {!isConfigured && (
            <div className="px-2 py-1 text-xs bg-yellow-600 text-yellow-100 rounded">
              Setup Required
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="p-1 text-gray-400 hover:text-white transition-colors"
              title="Clear chat"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            title="Close AI Assistant"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {(isExtractingText || !pdfDocument || error) && (
        <div className="p-4 border-b border-gray-600">
          {isExtractingText && (
            <div className="flex items-center gap-2 text-blue-400 text-sm">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span>Analyzing PDF content...</span>
            </div>
          )}
          
          {!pdfDocument && !isExtractingText && (
            <div className="text-gray-400 text-sm">
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Open a PDF to start using the AI assistant
            </div>
          )}

          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 p-2 rounded">
              <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}
        </div>
      )}

      {!isConfigured && (
        <div className="p-4 bg-yellow-900/20 border-b border-gray-600">
          <h3 className="text-yellow-400 font-medium text-sm mb-2">Setup Required</h3>
          <p className="text-yellow-300 text-xs mb-2">
            To use the AI assistant, add your Gemini API key:
          </p>
          <ol className="text-yellow-300 text-xs space-y-1 ml-4 list-decimal">
            <li>Get a free API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a></li>
            <li>Add <code className="bg-gray-700 px-1 rounded">VITE_GEMINI_API_KEY=your_key_here</code> to your .env file</li>
            <li>Restart the application</li>
          </ol>
        </div>
      )}

      <div className="flex-1 min-h-0">
        <AIChatBox
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
          disabled={!isConfigured || !pdfDocument || isExtractingText}
          placeholder={
            !isConfigured 
              ? 'Configure Gemini API key to use AI assistant'
              : !pdfDocument 
                ? 'Open a PDF to start chatting'
                : isExtractingText
                  ? 'Analyzing PDF content...'
                  : 'Ask me anything about this PDF...'
          }
        />
      </div>
    </div>
  );
};

export default AISidePanel;
