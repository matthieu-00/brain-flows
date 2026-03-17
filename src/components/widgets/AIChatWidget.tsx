import React, { useState } from 'react';
import { Send, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Widget } from '../../types';
import { useLayoutStore } from '../../store/layoutStore';
import { Button } from '../ui/Button';
import { getOpenClawAgentStatus, sendAgentMessage } from '../../lib/agentClient';

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
  const { updateWidget } = useLayoutStore();
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const messages: ChatMessage[] = widget.data?.messages || [];
  const threadId: string | undefined = widget.data?.threadId;

  const sendMessage = async () => {
    const content = message.trim();
    if (!content) return;
    setErrorMessage('');
    try {
      const status = await getOpenClawAgentStatus();
      if (!status.connected) {
        setErrorMessage('Connect your dedicated OpenClaw agent in Settings first.');
        return;
      }
    } catch {
      setErrorMessage('Unable to validate OpenClaw connection status.');
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    const updatedMessages = [...messages, userMessage];
    updateWidget(widget.id, {
      data: { ...widget.data, messages: updatedMessages }
    });

    setMessage('');
    setIsLoading(true);

    try {
      const response = await sendAgentMessage({
        surface: 'widget',
        threadId,
        threadName: threadId ? undefined : 'AI Chat Widget',
        message: content,
      });

      const assistantMessage: ChatMessage = {
        id: response.assistantMessage.id,
        role: 'assistant',
        content: response.assistantMessage.content,
        timestamp: response.assistantMessage.created_at,
      };

      updateWidget(widget.id, {
        data: { 
          ...widget.data, 
          threadId: response.thread.id,
          messages: [...updatedMessages, assistantMessage],
        }
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    updateWidget(widget.id, {
      data: { ...widget.data, messages: [] }
    });
  };

  return (
    <div className="flex flex-col min-h-[16rem]">
      {/* Controls */}
      <div className="flex items-center justify-between mb-3">
        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
        <div className="flex space-x-1">
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

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {errorMessage && (
          <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-xs text-red-700 dark:text-red-400">
            {errorMessage}
          </div>
        )}

        {messages.length === 0 ? (
          <div className="text-center py-8 text-neutral-500 dark:text-neutral-textMuted">
            <div className="inline-flex items-center justify-center w-12 h-12 mb-2 rounded-full bg-sage-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
              <Bot className="w-6 h-6 text-sage-700 dark:text-sage-300" />
            </div>
            <p className="text-sm">Start a conversation with AI</p>
            <p className="text-xs mt-1">
              Type a message below
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
                      ? 'bg-sage-700 text-white'
                      : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                  }`}
                >
                  <div>{msg.content}</div>
                  <div className={`text-xs mt-1 ${
                    msg.role === 'user' ? 'text-sage-100' : 'text-neutral-500 dark:text-neutral-textMuted'
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
            <div className="bg-neutral-200 dark:bg-neutral-800 px-3 py-2 rounded-lg text-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-neutral-200 dark:border-neutral-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-text focus:outline-none focus:ring-2 focus:ring-sage-700"
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