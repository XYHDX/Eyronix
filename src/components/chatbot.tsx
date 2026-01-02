
'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, MessageSquare, Send, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { setupChatbot } from '@/ai/flows/initial-chatbot-setup';
import { chatbotConversation } from '@/ai/flows/summarize-chatbot-convo';
import { type Message as GenkitMessage } from 'genkit';


interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isBotTyping]);


  useEffect(() => {
    async function initializeBot() {
      if (isOpen && messages.length === 0) {
        setIsBotTyping(true);
        try {
          await setupChatbot({ initialQa: 'Common questions about Eyronix security solutions.' });
        } catch (e) {
          console.error("Failed to setup chatbot", e);
        }

        setTimeout(() => {
          setMessages([
            {
              id: 1,
              text: 'Welcome to Eyronix! I am a support bot. How can I assist you with your security needs today?',
              sender: 'bot',
            },
          ]);
          setIsBotTyping(false);
        }, 1000);
      }
    }
    initializeBot();
  }, [isOpen, messages.length]);

  useEffect(() => {
    const handleOpenChatbot = (event: Event) => {
      const customEvent = event as CustomEvent;
      setIsOpen(true);
      if (customEvent.detail?.message) {
        setMessages(prev => [...prev, {
          id: Date.now(),
          text: customEvent.detail.message,
          sender: 'bot'
        }]);
      }
    };

    window.addEventListener('open-chatbot', handleOpenChatbot);
    return () => window.removeEventListener('open-chatbot', handleOpenChatbot);
  }, []);

  const handleSendMessage = async () => {
    if (inputValue.trim() === '') return;

    const userMessage: Message = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
    };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsBotTyping(true);

    try {
      const history: GenkitMessage[] = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        content: [{ text: msg.text }]
      })).slice(-6); // Keep last 6 messages for context

      const result = await chatbotConversation({
        history,
        message: currentInput,
      });

      const botResponse: Message = {
        id: Date.now() + 1,
        text: result.response,
        sender: 'bot',
      };
      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error("Chatbot conversation error:", error);
      const botResponse: Message = {
        id: Date.now() + 1,
        text: "I seem to be having some trouble right now. A human agent will get back to you shortly. For immediate assistance, please check our website.",
        sender: 'bot',
      };
      setMessages((prev) => [...prev, botResponse]);
    } finally {
      setIsBotTyping(false);
    }
  };

  return (
    <>
      <div className={cn("fixed bottom-4 right-4 z-50 transition-transform duration-300 ease-in-out", isOpen ? "translate-x-[calc(100%+2rem)]" : "translate-x-0")}>
        <Button
          size="icon"
          className="rounded-full h-16 w-16 shadow-lg"
          onClick={() => setIsOpen(true)}
          aria-label="Open support chatbot"
        >
          <MessageSquare size={32} />
        </Button>
      </div>
      <div className={cn("fixed bottom-4 right-4 z-[60] w-[calc(100%-2rem)] max-w-sm h-[70vh] max-h-[600px] transition-all duration-300 ease-in-out", isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none")}>
        <Card className="h-full flex flex-col shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarFallback className='bg-primary text-primary-foreground'><Bot /></AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-base">Support Bot</CardTitle>
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-green-500"></span>
                  <p className="text-xs text-muted-foreground">Online</p>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} aria-label="Close support chatbot">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="flex-grow p-0 min-h-0 overflow-hidden">
            <ScrollArea className="h-full p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'flex items-end gap-2',
                      message.sender === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    {message.sender === 'bot' && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className='bg-primary text-primary-foreground'><Bot /></AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={cn(
                        'max-w-[75%] rounded-lg px-3 py-2 text-sm break-words',
                        message.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      )}
                    >
                      {message.text}
                    </div>
                    {message.sender === 'user' && (
                      <Avatar className="h-8 w-8">
                        <AvatarFallback><User /></AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                ))}
                {isBotTyping && (
                  <div className="flex items-end gap-2 justify-start">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className='bg-primary text-primary-foreground'><Bot /></AvatarFallback>
                    </Avatar>
                    <div className="bg-muted rounded-lg px-3 py-2 text-sm flex items-center space-x-1">
                      <span className="h-1.5 w-1.5 bg-foreground rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="h-1.5 w-1.5 bg-foreground rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="h-1.5 w-1.5 bg-foreground rounded-full animate-bounce"></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex w-full items-center space-x-2"
            >
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type a message..."
                autoComplete="off"
                disabled={isBotTyping}
              />
              <Button type="submit" size="icon" disabled={isBotTyping} aria-label="Send message">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
