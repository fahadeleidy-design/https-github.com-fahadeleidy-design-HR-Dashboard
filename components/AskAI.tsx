import React, { useState, useRef, useEffect } from 'react';
import { Employee } from '../types';
import { queryDataWithAI } from '../lib/ai';

interface Message {
    sender: 'user' | 'ai';
    text: string;
}

export const AskAI: React.FC<{ employees: Employee[] }> = ({ employees }) => {
    const [messages, setMessages] = useState<Message[]>([
        { sender: 'ai', text: 'Hello! I am your AI assistant. Ask me anything about your employee data, like "How many employees are from Egypt?" or "Show me all contracts expiring in the next 90 days".' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages, isLoading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        setError(null);

        try {
            const aiResponse = await queryDataWithAI(input, employees);
            const aiMessage: Message = { sender: 'ai', text: aiResponse };
            setMessages(prev => [...prev, aiMessage]);
        } catch (err: any) {
            setError(`Sorry, something went wrong. ${err.message}`);
            const errorMessage: Message = { sender: 'ai', text: `Sorry, I couldn't get a response. Error: ${err.message}` };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 h-[calc(100vh-220px)] flex flex-col">
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4">Ask AI Assistant</h2>
            <div className="flex-1 overflow-y-auto pr-4 space-y-4 mb-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-2xl p-3 rounded-lg shadow-sm ${msg.sender === 'user' ? 'bg-primary-600 text-white' : 'bg-slate-100 dark:bg-slate-700'}`}>
                            <pre className="whitespace-pre-wrap font-sans text-sm">{msg.text}</pre>
                        </div>
                    </div>
                ))}
                {isLoading && (
                     <div className="flex justify-start">
                        <div className="max-w-xl p-3 rounded-lg bg-slate-100 dark:bg-slate-700">
                           <div className="flex items-center space-x-2">
                               <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse"></div>
                               <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse [animation-delay:0.2s]"></div>
                               <div className="w-2 h-2 rounded-full bg-slate-400 animate-pulse [animation-delay:0.4s]"></div>
                           </div>
                        </div>
                    </div>
                )}
                 <div ref={messagesEndRef} />
            </div>
            
            <form onSubmit={handleSubmit} className="mt-auto flex items-center gap-2 border-t border-slate-200 dark:border-slate-700 pt-4">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a question about your employee data..."
                    className="flex-1 p-2 border bg-transparent border-slate-300 dark:border-slate-600 rounded-md focus:ring-2 focus:ring-primary-500 transition"
                    disabled={isLoading}
                    aria-label="Ask the AI assistant a question"
                />
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-md hover:bg-primary-700 disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center gap-2 transition-colors" disabled={isLoading || !input.trim()}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.428A1 1 0 009.894 15V11a1 1 0 112 0v4a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                    </svg>
                    <span>Send</span>
                </button>
            </form>
        </div>
    );
};