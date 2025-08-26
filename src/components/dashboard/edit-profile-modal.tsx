
"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Edit, Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "../ui/skeleton";

type UserData = {
  name: string;
  username: string;
  phone: string;
};

export function EditProfileModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [userData, setUserData] = useState<UserData>({ name: "", username: "", phone: "" });
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen) {
      setIsLoading(true); // Reset loading state when dialog is closed
      return;
    };

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({
            name: data.name || "",
            username: data.username || "",
            phone: data.phone || "",
          });
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setUserData(prev => ({ ...prev, [id]: value }));
  }

  const handleSaveChanges = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast({ title: "Error", description: "You must be logged in to save changes.", variant: "destructive" });
      return;
    }
    
    setIsSaving(true);
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await updateDoc(userDocRef, {
        name: userData.name,
        username: userData.username,
        phone: userData.phone,
      });
      toast({ title: "Success!", description: "Your profile has been updated.", className: "bg-accent text-accent-foreground" });
      setIsOpen(false); // Close dialog on success
    } catch (error) {
      console.error("Error saving profile:", error);
      toast({ title: "Save Failed", description: "Could not update your profile. Please try again.", variant: "destructive"});
    } finally {
      setIsSaving(false);
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full neumorphism-outset-heavy py-6 text-base" variant="outline">
          <Edit className="mr-2 h-5 w-5" /> Edit Profile
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md w-full rounded-2xl p-0.5 glowing-border bg-transparent border-0">
         <div className="w-full h-full rounded-2xl p-6 bg-card/95 backdrop-blur-lg neumorphism-inset-heavy">
            <DialogHeader>
                <DialogTitle className="text-2xl font-headline">Edit Your Profile</DialogTitle>
            </DialogHeader>
            {isLoading ? (
               <div className="space-y-6 mt-6">
                  <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-full" /></div>
                  <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-full" /></div>
                  <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-full" /></div>
                  <Skeleton className="h-12 w-full" />
               </div>
            ) : (
               <div className="space-y-6 mt-6">
                  <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" value={userData.name} onChange={handleChange} className="neumorphism-inset-heavy" />
                  </div>
                   <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" value={userData.username} onChange={handleChange} className="neumorphism-inset-heavy" />
                  </div>
                   <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" value={userData.phone} onChange={handleChange} className="neumorphism-inset-heavy" />
                  </div>
                  <Button onClick={handleSaveChanges} disabled={isSaving} className="w-full neumorphism-outset-heavy bg-primary text-primary-foreground py-6">
                      {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
                      {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
              </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
