
"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Bell, Loader2, Mail, CheckCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { db, auth } from '@/firebase/config';
import { collection, query, orderBy, onSnapshot, doc, getDoc, setDoc, DocumentData, Timestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';

type Message = {
  id: string;
  title: string;
  content: string;
  createdAt: Timestamp;
};

type UserMessageStatus = {
  lastReadTimestamp: Timestamp | null;
};

export function InboxPanel() {
  const [user] = useAuthState(auth);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) {
        setIsLoading(false);
        return;
    };

    const messagesQuery = query(collection(db, 'messages'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(messagesQuery, async (querySnapshot) => {
      const msgs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      setMessages(msgs);

      // Check for unread messages
      const userStatusRef = doc(db, 'users', user.uid, 'status', 'messages');
      const userStatusSnap = await getDoc(userStatusRef);
      const lastReadTimestamp = userStatusSnap.exists() ? (userStatusSnap.data() as UserMessageStatus).lastReadTimestamp : null;

      if (lastReadTimestamp) {
        const newUnreadCount = msgs.filter(msg => msg.createdAt > lastReadTimestamp).length;
        setUnreadCount(newUnreadCount);
      } else {
        setUnreadCount(msgs.length); // All messages are unread if no timestamp
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);
  
  const handlePanelOpen = async () => {
    setIsOpen(true);
    if (unreadCount > 0 && user) {
        const userStatusRef = doc(db, 'users', user.uid, 'status', 'messages');
        await setDoc(userStatusRef, { lastReadTimestamp: Timestamp.now() });
        setUnreadCount(0); // Optimistically set unread count to 0
    }
  };


  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative neumorphism-outset-heavy" onClick={handlePanelOpen}>
          <Bell />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center rounded-full p-0"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] p-0">
        <SheetHeader className="p-6 border-b">
          <SheetTitle>Inbox</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100%-65px)]">
             <div className="p-6">
                {isLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                ) : messages.length > 0 ? (
                    <div className="space-y-6">
                        {messages.map((message) => (
                             <div key={message.id} className="p-4 rounded-lg neumorphism-inset-heavy">
                                 <div className="flex justify-between items-start">
                                    <h3 className="font-bold font-headline text-lg">{message.title}</h3>
                                    <p className="text-xs text-muted-foreground whitespace-nowrap">
                                        {message.createdAt.toDate().toLocaleDateString()}
                                    </p>
                                 </div>
                                <p className="mt-2 text-muted-foreground">{message.content}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                     <div className="flex flex-col items-center justify-center text-center h-full pt-20">
                        <Mail className="w-16 h-16 text-muted-foreground mb-4" />
                        <h3 className="font-bold text-xl">No Messages</h3>
                        <p className="text-muted-foreground">You have no new messages at this time.</p>
                    </div>
                )}
             </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
