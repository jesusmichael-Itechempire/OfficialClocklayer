
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { sendMessageToAllUsers } from '@/ai/flows/messaging';
import { Loader2, Send, Lock } from 'lucide-react';

const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleLogin = () => {
    if (!adminPassword) {
       toast({
        title: 'Configuration Error',
        description: 'The admin password is not set on the server.',
        variant: 'destructive',
      });
      return;
    }
    if (password === adminPassword) {
      setIsAuthenticated(true);
    } else {
      toast({
        title: 'Authentication Failed',
        description: 'The password you entered is incorrect.',
        variant: 'destructive',
      });
    }
  };

  const handleSendMessage = async () => {
    if (!title || !content) {
      toast({
        title: 'Missing Fields',
        description: 'Please provide a title and content for the message.',
        variant: 'destructive',
      });
      return;
    }
    setIsSending(true);
    try {
      const result = await sendMessageToAllUsers({ title, content });
      if (result.success) {
        toast({
          title: 'Message Sent!',
          description: 'Your message has been sent to all users.',
          className: 'bg-accent text-accent-foreground',
        });
        setTitle('');
        setContent('');
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        title: 'Sending Failed',
        description: error.message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    } finally {
      setIsSending(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm space-y-4 rounded-lg border p-8 shadow-lg">
          <div className="text-center">
            <Lock className="mx-auto h-12 w-12 text-primary" />
            <h1 className="mt-4 text-2xl font-bold font-headline">Admin Access</h1>
            <p className="text-muted-foreground">Enter the password to continue.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <Button onClick={handleLogin} className="w-full">
            Enter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="mx-auto max-w-2xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold font-headline">Admin Panel</h1>
          <p className="mt-2 text-muted-foreground">Send a message to all users.</p>
        </div>
        <div className="mt-8 space-y-6 rounded-lg border p-8 shadow-lg">
          <div className="space-y-2">
            <Label htmlFor="title">Message Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Welcome to the Next Phase!"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="content">Message Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your message here..."
              rows={8}
            />
          </div>
          <Button onClick={handleSendMessage} disabled={isSending} className="w-full">
            {isSending ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Send className="mr-2 h-5 w-5" />
            )}
            {isSending ? 'Sending...' : 'Send Message to All Users'}
          </Button>
        </div>
      </div>
    </div>
  );
}
