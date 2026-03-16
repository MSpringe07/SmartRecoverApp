import { useState, useEffect, useRef } from 'react';
import { DayData, UserProfile } from '../App';
import { projectId } from '../utils/supabase/info';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Textarea } from './ui/textarea';
import { Bot, X, Send, Minimize2, Maximize2, Plus, MessageSquare, Menu } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { supabase } from '../utils/supabase/client';
import ReactMarkdown from 'react-markdown';

interface AIChatProps {
  session: any;
  profile: UserProfile | null;
  weekData: DayData[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface ChatSession {
  id: string;
  title: string;
  updated_at: string;
  created_at?: string;
}

export function AIChat({ session, profile, weekData }: AIChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Session states
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('');
  const [isNewSession, setIsNewSession] = useState(true);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mock UUID generator since crypto might not be imported
  const generateSimpleId = () => Math.random().toString(36).substring(2, 15);

  useEffect(() => {
    if (isOpen) {
      loadSessions();
      if (!currentSessionId) {
        startNewChat();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (currentSessionId && isOpen && !isNewSession) {
      loadChatHistory(currentSessionId);
    }
  }, [currentSessionId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const startNewChat = () => {
    setCurrentSessionId(generateSimpleId());
    setMessages([]);
    setIsNewSession(true);
  };

  const loadSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading sessions:', error);
        return;
      }

      if (data && data.length > 0) {
        setChatSessions(data as ChatSession[]);
      } else {
        setChatSessions([]);
      }
    } catch (err) {
      console.error('Catch Error loading sessions:', err);
    }
  };

  const loadChatHistory = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) {
        throw error;
      }

      if (data) {
        const formattedMessages: Message[] = data.map((msg: any) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.created_at,
        }));
        setMessages(formattedMessages);
      }
    } catch (err) {
      console.error('Error loading chat history:', err);
    }
  };

  const selectSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setIsNewSession(false);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev: Message[]) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: {
          message: input,
          chatHistory: messages.slice(-10),
          profile,
          weekData: weekData ? weekData.slice(-7) : [],
          sessionId: currentSessionId,
          isNewSession: isNewSession
        },
      });

      console.log('API RAW RESPONSE:', data, error);

      if (!error && data && !data.isError) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response || "No response received",
          timestamp: new Date().toISOString(),
        };
        setMessages((prev: Message[]) => [...prev, assistantMessage]);

        // If this was a new session, refresh titles
        if (isNewSession) {
          setIsNewSession(false);
          loadSessions();
        }
      } else {
        console.error('API Error manually caught:', data || error);
        const errorMessage: Message = {
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date().toISOString(),
        };
        setMessages((prev: Message[]) => [...prev, errorMessage]);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an network error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev: Message[]) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          className="rounded-full w-16 h-16 shadow-2xl hover:shadow-3xl transition-all bg-gradient-to-br from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 border-2 border-purple-400"
          onClick={() => setIsOpen(true)}
        >
          <Bot className="w-7 h-7 text-white" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className={`shadow-2xl border-0 transition-all duration-300 ${
        isMinimized 
          ? 'w-80 h-[60px]' 
          : (isSidebarOpen ? 'w-[90vw] sm:w-[800px] h-[80vh] sm:h-[600px]' : 'w-[90vw] sm:w-[540px] h-[80vh] sm:h-[600px]')
      } flex flex-col overflow-hidden max-w-[90vw] max-h-[90vh]`}>
        {/* Header - kept original aesthetics */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-purple-700 to-purple-900 text-white shrink-0">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 mr-1 p-1 h-8 w-8"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="p-2 bg-white/20 rounded-lg">
              <Bot className="w-5 h-5" />
            </div>
            <span className="font-semibold">AI Training Assistant</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20"
              onClick={() => setIsOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <div className="flex flex-1 overflow-hidden min-h-0">
            {/* Sidebar Columns */}
            {isSidebarOpen && (
              <div className="w-[260px] border-r border-slate-200 bg-slate-50 flex flex-col shrink-0 overflow-y-auto">
                <div className="p-4 border-b border-slate-200 shrink-0">
                  <Button 
                    onClick={startNewChat}
                    variant="outline" 
                    className="w-full justify-start gap-2 bg-white hover:bg-slate-100 border-slate-200 shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                    New chat
                  </Button>
                </div>
                <div className="p-3 text-xs font-semibold text-slate-500 uppercase">
                  Recent Chats
                </div>
                <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-1">
                  {chatSessions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => selectSession(s.id)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm truncate transition-colors flex items-center gap-2 ${
                        currentSessionId === s.id 
                          ? 'bg-purple-100 text-purple-900 font-medium' 
                          : 'text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
                      <span className="truncate">{s.title || 'New Chat'}</span>
                    </button>
                  ))}
                  {chatSessions.length === 0 && (
                    <div className="text-center p-4 text-xs text-slate-400">
                      No past chats found.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Main Chat Column */}
            <div className="flex-1 flex flex-col min-w-0 bg-white">
              <div 
                ref={scrollRef}
                className="flex-1 p-4 space-y-4 overflow-y-auto"
              >
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6">
                    <Bot className="w-16 h-16 text-slate-300 mb-4" />
                    <h4 className="text-slate-900 mb-2">Welcome to Your AI Assistant</h4>
                    <p className="text-slate-500 mb-4">
                      Ask me anything about your training, recovery, nutrition, or get personalized recommendations!
                    </p>
                    <div className="space-y-2 text-sm text-slate-600">
                      <p className="italic">"Am I overtraining?"</p>
                      <p className="italic">"What should I eat today?"</p>
                      <p className="italic">"When should I take a rest day?"</p>
                    </div>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${message.role === 'user'
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                            : 'bg-gradient-to-r from-blue-50 to-purple-50 text-slate-900'
                          }`}
                      >
                        <div className="text-sm">
                          <ReactMarkdown
                            components={{
                              p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                              ul: ({ node, ...props }) => <ul className="list-disc ml-4 mb-2" {...props} />,
                              ol: ({ node, ...props }) => <ol className="list-decimal ml-4 mb-2" {...props} />,
                              li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                              strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
                              a: ({ node, ...props }) => <a className="underline text-blue-300" {...props} />,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                        <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-purple-100' : 'text-slate-500'
                          }`}>
                          {new Date(message.timestamp).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 rounded-lg p-3">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area - kept original aesthetics */}
              <div className="p-4 border-t shrink-0">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Ask me anything..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    rows={2}
                    className="resize-none"
                    disabled={loading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={loading || !input.trim()}
                    size="sm"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}