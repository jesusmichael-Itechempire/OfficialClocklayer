
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { auth, db } from "@/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, onSnapshot, DocumentData } from "firebase/firestore";
import { User, Users } from "lucide-react";
import { useEffect, useState } from "react";

type Referral = {
    name: string;
    username: string;
    avatar: string;
}

export function ReferralList() {
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                const referralsQuery = query(collection(db, "users"), where("referredBy", "==", currentUser.uid));

                const unsubscribeSnapshot = onSnapshot(referralsQuery, (querySnapshot) => {
                    const referralsData: Referral[] = [];
                    querySnapshot.forEach((doc) => {
                        const data = doc.data() as DocumentData;
                        referralsData.push({
                            name: data.name,
                            username: data.username,
                            avatar: data.profilePicture || `https://placehold.co/100x100.png?text=${data.name.charAt(0)}`
                        });
                    });
                    setReferrals(referralsData);
                    setIsLoading(false);
                });

                return () => unsubscribeSnapshot();
            } else {
                setReferrals([]);
                setIsLoading(false);
            }
        });
        return () => unsubscribeAuth();
    }, []);

    return (
        <div>
            <h4 className="font-semibold mb-3">Your Referrals ({referrals.length})</h4>
             {isLoading ? (
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                         <div key={i} className="flex items-center gap-4">
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[150px]" />
                                <Skeleton className="h-3 w-[100px]" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : referrals.length > 0 ? (
                <ScrollArea className="h-48 pr-4">
                    <div className="space-y-4">
                        {referrals.map((ref, index) => (
                            <div key={index} className="flex items-center gap-4 p-2 rounded-lg bg-background/30 neumorphism-outset-heavy">
                                <Avatar className="w-10 h-10">
                                    <AvatarImage src={ref.avatar} alt={ref.name} data-ai-hint="person portrait"/>
                                    <AvatarFallback><User /></AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold text-sm">{ref.name}</p>
                                    <p className="text-xs text-muted-foreground">@{ref.username}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            ) : (
                <div className="flex flex-col items-center justify-center h-48 text-center bg-background/30 rounded-lg neumorphism-inset-heavy">
                    <Users className="w-10 h-10 text-muted-foreground mb-2"/>
                    <p className="text-sm font-semibold">No referrals yet.</p>
                    <p className="text-xs text-muted-foreground">Share your link to get started!</p>
                </div>
            )}
        </div>
    )
}
