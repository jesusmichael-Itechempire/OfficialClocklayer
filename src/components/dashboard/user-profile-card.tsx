
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, User } from "lucide-react";
import { auth, db } from "@/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { InboxPanel } from "./inbox-panel";

type UserData = {
  name: string;
  username: string;
  profilePicture: string | null;
  hasCompletedZealyTasks?: boolean;
};

export function UserProfileCard() {
    const [user, setUser] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const userDocRef = doc(db, "users", currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                    setUser(userDoc.data() as UserData);
                } else {
                    // Handle case where user is auth'd but has no doc
                    setUser({ name: "User Not Found", username: "", profilePicture: null });
                }
            } else {
                // Handle signed out state
                 setUser(null);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (isLoading) {
        return (
             <div className="w-full p-0.5 glowing-border rounded-2xl">
                <div className="relative w-full h-full rounded-2xl p-6 md:p-8 bg-card/80 backdrop-blur-sm neumorphism-inset-heavy flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <Skeleton className="w-24 h-24 md:w-32 md:h-32 rounded-full p-1" />
                        <div className="space-y-2 text-center md:text-left">
                            <Skeleton className="h-10 w-48" />
                            <Skeleton className="h-6 w-32" />
                        </div>
                    </div>
                     <Skeleton className="h-10 w-10 rounded-md" />
                </div>
            </div>
        )
    }

     if (!user) {
        return (
             <div className="w-full p-0.5 glowing-border rounded-2xl">
                <div className="relative w-full h-full rounded-2xl p-6 md:p-8 bg-card/80 backdrop-blur-sm neumorphism-inset-heavy flex flex-col md:flex-row items-center justify-center gap-6">
                    <p className="text-muted-foreground">Please sign in to view your dashboard.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="w-full p-0.5 glowing-border rounded-2xl">
            <div className="relative w-full h-full rounded-2xl p-6 md:p-8 bg-card/80 backdrop-blur-sm neumorphism-inset-heavy flex flex-col md:flex-row items-center justify-between gap-6">
                 <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="relative">
                        <Avatar className="w-24 h-24 md:w-32 md:h-32 neumorphism-outset-heavy p-1 glowing-border">
                             <div className="relative w-full h-full rounded-full overflow-hidden">
                                <AvatarImage src={user.profilePicture ?? undefined} alt="User avatar" data-ai-hint="futuristic portrait"/>
                                <AvatarFallback className="bg-transparent"><User className="w-12 h-12" /></AvatarFallback>
                            </div>
                        </Avatar>
                         {user.hasCompletedZealyTasks && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-tr from-yellow-400 to-amber-600 rounded-full flex items-center justify-center border-2 border-background animate-pulse-gold cursor-pointer">
                                            <Check className="w-5 h-5 text-white" />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Successfully joined the waitlist!</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                         )}
                    </div>
                    <div className="text-center md:text-left">
                        <h2 className="text-3xl md:text-4xl font-bold font-headline">{user.name}</h2>
                        <p className="text-lg text-muted-foreground">@{user.username}</p>
                    </div>
                 </div>
                 <div className="self-center md:self-start">
                    <InboxPanel />
                 </div>
            </div>
        </div>
    )
}
