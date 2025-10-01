import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';

interface AIChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onSemanticSearch?: (query: string) => void;
  onNavigateToPage?: (pageNumber: number) => void;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const AIChatBox: React.FC<AIChatBoxProps> = ({ 
  messages, 
  onSendMessage, 
  onSemanticSearch,
  onNavigateToPage,
  isLoading, 
  disabled = false,
  placeholder = "Ask me anything about this PDF..."
}) => {
  const [inputValue, setInputValue] = useState('');
  const [searchMode, setSearchMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMessage = inputValue.trim();
    if (trimmedMessage && !isLoading && !disabled) {
      if (searchMode && onSemanticSearch) {
        onSemanticSearch(trimmedMessage);
      } else {
        onSendMessage(trimmedMessage);
      }
      setInputValue('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 ai-panel-scroll">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <svg 
              className="w-12 h-12 mx-auto mb-4 text-gray-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
              />
            </svg>
            <p className="text-sm">Start a conversation about your PDF</p>
            <p className="text-xs text-gray-500 mt-2">
              Try: "Summarize this document" or "What are the key points?"
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  max-w-[80%] rounded-lg p-3 text-sm
                  ${message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-100'
                  }
                  ${message.isStreaming ? 'animate-pulse' : ''}
                `}
              >
                <div className={`whitespace-pre-wrap break-words ${message.type === 'assistant' ? 'ai-response' : ''}`}>
                  {message.content}
                  {message.isStreaming && (
                    <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
                  )}
                </div>
                
                {/* Display search results */}
                {message.searchResults && message.searchResults.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <div className="text-xs font-semibold text-blue-300 mb-2">
                      📍 Found on {message.searchResults.length} page{message.searchResults.length > 1 ? 's' : ''}:
                    </div>
                    {message.searchResults.map((result, idx) => (
                      <div 
                        key={idx}
                        className="bg-gray-800 rounded p-2 cursor-pointer hover:bg-gray-750 transition-colors border border-gray-600"
                        onClick={() => onNavigateToPage?.(result.pageNumber)}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-blue-400 font-semibold text-xs shrink-0">
                            Page {result.pageNumber}
                          </span>
                          <span className="text-gray-300 text-xs flex-1">
                            {result.snippet}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className={`
                  text-xs mt-1 opacity-70
                  ${message.type === 'user' ? 'text-blue-100' : 'text-gray-400'}
                `}>
                  {formatTimestamp(message.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-gray-600 p-4">
        {onSemanticSearch && (
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={() => setSearchMode(false)}
              className={`
                flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors
                ${!searchMode 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-650'
                }
              `}
            >
              💬 Chat
            </button>
            <button
              type="button"
              onClick={() => setSearchMode(true)}
              className={`
                flex-1 px-3 py-1.5 rounded text-xs font-medium transition-colors
                ${searchMode 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-650'
                }
              `}
            >
              🔍 Search
            </button>
          </div>
        )}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={
              disabled 
                ? 'Configure Gemini API key to use AI assistant' 
                : searchMode 
                  ? 'Search: "Where does it mention late fees?"'
                  : placeholder
            }
            disabled={disabled || isLoading}
            className={`
              flex-1 resize-none rounded-lg px-3 py-2 text-sm
              bg-gray-700 text-white placeholder-gray-400
              border border-gray-600 focus:border-blue-500 focus:outline-none
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              min-h-[40px] max-h-[120px]
            `}
            rows={1}
          />
          <button
            type="submit"
            disabled={disabled || isLoading || !inputValue.trim()}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${disabled || isLoading || !inputValue.trim()
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }
            `}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>{searchMode ? 'Searching' : 'Sending'}</span>
              </div>
            ) : searchMode ? (
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                />
              </svg>
            ) : (
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" 
                />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AIChatBox;
