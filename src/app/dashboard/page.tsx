
"use client"

import { EditProfileModal } from "@/components/dashboard/edit-profile-modal";
import { InfoCard } from "@/components/dashboard/info-card";
import { ReferralList } from "@/components/dashboard/referral-list";
import { UserProfileCard } from "@/components/dashboard/user-profile-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/firebase/config";
import { doc, getDoc, DocumentData } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { Clipboard, Loader2, Monitor, Smartphone } from "lucide-react";
import { useEffect, useState } from "react";

function getSimplifiedUserAgent(ua: string) {
    if (!ua) return "Unknown Device";
    if (/android/i.test(ua)) return "Android Device";
    if (/iPad|iPhone|iPod/.test(ua)) return "iOS Device";
    if (/windows phone/i.test(ua)) return "Windows Phone";
    if (/macintosh/i.test(ua)) return "Mac";
    if (/windows/i.test(ua)) return "Windows PC";
    if (/linux/i.test(ua)) return "Linux PC";
    return "Unknown Device";
}

export default function DashboardPage() {
    const [referralLink, setReferralLink] = useState("");
    const [deviceInfo, setDeviceInfo] = useState("Loading device info...");
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const userDocRef = doc(db, "users", currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists()) {
                   const userData = userDoc.data() as DocumentData;
                   const username = userData.username;
                   // Use window.location.origin to get the base URL dynamically
                   const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
                   setReferralLink(`${baseUrl}/waitlist?ref=${username}`);
                   setDeviceInfo(getSimplifiedUserAgent(userData.signupUserAgent));
                }
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const copyToClipboard = () => {
        navigator.clipboard.writeText(referralLink).then(() => {
            toast({
                title: "Copied!",
                description: "Referral link copied to clipboard.",
                className: "bg-accent text-accent-foreground",
            });
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            toast({
                title: "Failed to copy",
                description: "Could not copy the link. Please try again.",
                variant: "destructive",
            });
        });
    };

    return (
        <div className="relative min-h-screen w-full overflow-hidden bg-background font-body text-foreground">
            <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:6rem_4rem]">
                <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_800px_at_50%_200px,hsl(var(--primary)/0.1),transparent)]"></div>
            </div>
            <main className="flex min-h-screen w-full flex-col items-center justify-center p-4">
                <div className="w-full max-w-5xl space-y-8 animate-subtle-float">
                    <UserProfileCard />

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                        {/* Referral Section */}
                        <Card className="col-span-1 md:col-span-2 w-full p-0.5 glowing-border rounded-2xl bg-transparent">
                            <div className="relative w-full h-full rounded-2xl p-6 bg-card/80 backdrop-blur-sm neumorphism-inset-heavy">
                                <h3 className="text-xl font-headline font-semibold mb-4">Refer & Earn</h3>
                                <p className="text-muted-foreground mb-4">
                                    Earn more by referring others. Share your unique link below.
                                </p>
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50 neumorphism-outset-heavy">
                                    {isLoading ? (
                                        <div className="w-full flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span className="text-sm text-muted-foreground">Generating your link...</span>
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            readOnly
                                            value={referralLink}
                                            className="w-full bg-transparent outline-none text-sm text-primary"
                                        />
                                    )}
                                    <Button size="sm" variant="ghost" className="neumorphism-outset-heavy" onClick={copyToClipboard} disabled={isLoading || !referralLink}>
                                        <Clipboard />
                                    </Button>
                                </div>
                                <Separator className="my-6" />
                                <ReferralList />
                            </div>
                        </Card>

                        {/* Device Info & Actions */}
                        <div className="space-y-8">
                           <InfoCard
                             icon={deviceInfo.includes("PC") || deviceInfo.includes("Mac") ? <Monitor className="w-8 h-8 text-primary"/> : <Smartphone className="w-8 h-8 text-primary"/>}
                             title="Signup Device"
                             description={deviceInfo}
                           />
                           <EditProfileModal />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
