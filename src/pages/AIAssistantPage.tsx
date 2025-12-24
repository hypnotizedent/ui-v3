import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PaperPlaneRight, Robot, Spinner, ThumbsUp, ThumbsDown } from '@phosphor-icons/react';

const API_BASE = import.meta.env.VITE_API_URL || 'https://mintprints-api.ronny.works';

interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    id?: string;
    timestamp?: string;
}

interface AISession {
    sessionId: string;
    messages: Message[];
}

export function AIAssistantPage() {
    const [session, setSession] = useState<AISession | null>(null);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [aiHealth, setAiHealth] = useState<'checking' | 'online' | 'offline'>('checking');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Check AI health on mount
    useEffect(() => {
        checkHealth();
    }, []);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [session?.messages]);

    const checkHealth = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/ai/health`);
            const data = await res.json();
            setAiHealth(data.ollama?.connected ? 'online' : 'offline');
        } catch {
            setAiHealth('offline');
        }
    };

    const createSession = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/ai/sessions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contextType: 'general' })
            });
            const data = await res.json();
            return data.session_id;
        } catch (err) {
            console.error('Failed to create session:', err);
            return null;
        }
    };

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        setLoading(true);
        setError(null);

        try {
            // Create session if needed
            let sessionId = session?.sessionId;
            if (!sessionId) {
                sessionId = await createSession();
                if (!sessionId) throw new Error('Failed to create session');
            }

            // Add user message to UI immediately
            const userMessage: Message = { role: 'user', content: input.trim() };
            setSession(prev => ({
                sessionId: sessionId!,
                messages: [...(prev?.messages || []), userMessage]
            }));
            setInput('');

            // Send to API
            const res = await fetch(`${API_BASE}/api/ai/sessions/${sessionId}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: input.trim() })
            });

            if (!res.ok) throw new Error('Failed to send message');

            const data = await res.json();

            // Add assistant response
            const assistantMessage: Message = {
                role: 'assistant',
                content: data.response || data.message || 'No response received',
                id: data.message_id
            };

            setSession(prev => ({
                sessionId: sessionId!,
                messages: [...(prev?.messages || []), assistantMessage]
            }));

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const sendFeedback = async (messageId: string, isPositive: boolean) => {
        if (!session?.sessionId) return;
        try {
            await fetch(`${API_BASE}/api/ai/sessions/${session.sessionId}/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message_id: messageId, is_positive: isPositive })
            });
        } catch (err) {
            console.error('Failed to send feedback:', err);
        }
    };

    return (
        <Card className="h-[calc(100vh-6rem)] flex flex-col">
            <CardHeader className="border-b pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Robot size={28} weight="duotone" className="text-primary" />
                        <div>
                            <CardTitle>AI Assistant</CardTitle>
                            <p className="text-sm text-muted-foreground">Powered by Ollama (Local LLM)</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${aiHealth === 'online' ? 'bg-green-500' :
                                aiHealth === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
                            }`} />
                        <span className="text-xs text-muted-foreground capitalize">{aiHealth}</span>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-4 overflow-hidden">
                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                    {!session?.messages?.length && (
                        <div className="text-center py-12">
                            <Robot size={48} className="mx-auto mb-4 text-muted-foreground/50" />
                            <h3 className="text-lg font-medium mb-2">Welcome to AI Assistant</h3>
                            <p className="text-muted-foreground text-sm max-w-md mx-auto">
                                Ask me about print shop operations, order pricing, turnaround times, or anything else related to Mint Prints.
                            </p>
                        </div>
                    )}

                    {session?.messages?.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-lg px-4 py-2 ${msg.role === 'user'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted'
                                    }`}
                            >
                                <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                                {msg.role === 'assistant' && msg.id && (
                                    <div className="flex gap-1 mt-2 pt-2 border-t border-border/50">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0"
                                            onClick={() => sendFeedback(msg.id!, true)}
                                        >
                                            <ThumbsUp size={14} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 w-6 p-0"
                                            onClick={() => sendFeedback(msg.id!, false)}
                                        >
                                            <ThumbsDown size={14} />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {loading && (
                        <div className="flex justify-start">
                            <div className="bg-muted rounded-lg px-4 py-3">
                                <Spinner size={20} className="animate-spin" />
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-destructive/10 text-destructive rounded-lg px-4 py-2 text-sm">
                            {error}
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t pt-4 mt-4">
                    <div className="flex gap-2">
                        <Textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask me anything about Mint Prints..."
                            className="min-h-[60px] resize-none"
                            disabled={loading || aiHealth === 'offline'}
                        />
                        <Button
                            onClick={sendMessage}
                            disabled={loading || !input.trim() || aiHealth === 'offline'}
                            className="self-end"
                        >
                            {loading ? <Spinner className="animate-spin" /> : <PaperPlaneRight size={20} />}
                        </Button>
                    </div>
                    {aiHealth === 'offline' && (
                        <p className="text-xs text-destructive mt-2">AI service is offline. Please try again later.</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
