// Attribution: Based on NLUX
// Repository: https://github.com/nluxai/nlux

import React, { useState, useEffect } from 'react';
import { Send, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// Note: NLUX integration would go here, but for now we'll keep the mock implementation
// import { AiChat } from '@nlux/react';
import { Widget } from '../../types';
import { useLayoutStore } from '../../store/layoutStore';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { getOpenAIKeyError } from '../../utils/apiKeyValidation';

interface AIChatWidgetProps {
  widget: Widget;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

const AIChatWidget: React.FC<AIChatWidgetProps> = ({ widget }) => {
  const { updateWidget, updateSettings, settings } = useLayoutStore();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(settings.apiKeys?.openai || '');
  const [errorMessage, setErrorMessage] = useState('');

  // Sync temp API key when settings panel opens
  useEffect(() => {
    if (showSettings) {
      setTempApiKey(settings.apiKeys?.openai || '');
    }
  }, [showSettings, settings.apiKeys?.openai]);

  const messages: ChatMessage[] = widget.data?.messages || [];
  const apiKey = settings.apiKeys?.openai;

  const sendMessage = async () => {
    if (!message.trim()) return;
    const apiError = getOpenAIKeyError(apiKey);
    if (apiError) {
      setErrorMessage(apiError);
      setShowSettings(true);
      return;
    }
    setErrorMessage('');

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    updateWidget(widget.id, {
      data: { ...widget.data, messages: updatedMessages }
    });

    setMessage('');
    setIsLoading(true);

    try {
      // TODO: Replace with actual NLUX integration
      // const response = await nluxAdapter.sendMessage(message);
      
      // Mock AI response for now
      const responses = [
        "That's an interesting question! Let me think about that...",
        "I'd be happy to help you with that. Here's what I think:",
        "Great point! From my perspective, I would suggest:",
        "That's a thoughtful question. Based on what you've shared:",
        "I understand what you're asking. Here's my take on it:",
      ];

      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: randomResponse,
        timestamp: new Date().toISOString(),
      };

      updateWidget(widget.id, {
        data: { 
          ...widget.data, 
          messages: [...updatedMessages, assistantMessage] 
        }
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setErrorMessage('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveApiKey = () => {
    const validationError = getOpenAIKeyError(tempApiKey);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    updateSettings({
      apiKeys: {
        ...settings.apiKeys,
        openai: tempApiKey.trim(),
      },
    });
    setShowSettings(false);
    setErrorMessage('');
  };

  const clearChat = () => {
    updateWidget(widget.id, {
      data: { ...widget.data, messages: [] }
    });
  };

  return (
    <div className="flex flex-col h-80">
      {/* Controls */}
      <div className="flex items-center justify-between mb-3">
        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        <div className="flex space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSettings(!showSettings)}
            className="p-1"
          >
            <Settings className="w-4 h-4" />
          </Button>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearChat}
              className="p-1 text-red-600"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-3 border-b border-gray-200 dark:border-neutral-600 bg-gray-50 dark:bg-neutral-800"
          >
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Enter OpenAI API Key"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                hint="Your API key is stored locally and never shared"
              />
              <div className="flex space-x-2">
                <Button size="sm" onClick={saveApiKey}>
                  Save Key
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {errorMessage && (
          <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-xs text-red-700 dark:text-red-400">
            {errorMessage}
          </div>
        )}

        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-neutral-textMuted">
            <div className="text-4xl mb-2">🤖</div>
            <p className="text-sm">Start a conversation with AI</p>
            <p className="text-xs mt-1">
              {!apiKey ? 'Set up your API key first' : 'Type a message below'}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 dark:bg-neutral-800 text-gray-800 dark:text-neutral-100'
                  }`}
                >
                  <div>{msg.content}</div>
                  <div className={`text-xs mt-1 ${
                    msg.role === 'user' ? 'text-blue-100' : 'text-gray-500 dark:text-neutral-textMuted'
                  }`}>
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-gray-200 dark:bg-neutral-800 px-3 py-2 rounded-lg text-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 dark:bg-neutral-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 dark:bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 dark:bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-200">
        <div className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={!message.trim() || isLoading}
            size="sm"
            className="px-3"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AIChatWidget;