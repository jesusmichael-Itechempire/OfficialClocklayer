
"use client";

import { verifyHuman } from "@/ai/flows/human-verification";
import { confirmZealyTasks } from "@/ai/flows/zealy-verification";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { auth, db } from "@/firebase/config";
import { TwitterAuthProvider, signInWithPopup, getAdditionalUserInfo, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";
import { doc, setDoc, serverTimestamp, updateDoc, collection, query, where, onSnapshot, getDocs, limit, getDoc } from "firebase/firestore";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { storage } from "@/firebase/config";
import { ArrowLeft, ArrowRight, Camera, CheckCircle2, Edit, ExternalLink, Loader2, LogIn, Phone, Rocket, User, Twitter as TwitterIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type FC, type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Script from 'next/script';


const TOTAL_STEPS = 6;
const TOTAL_SLOTS = 30000;

type UserData = {
  name: string;
  username: string;
  profilePicture: string | null;
  phone: string;
};

const initialUserData: UserData = {
  name: "",
  username: "",
  profilePicture: null,
  phone: "",
};

export function SignUpFlow({ referralCode }: { referralCode: string | null }) {
  const [step, setStep] = useState(1);
  const [userData, setUserData] = useState<UserData>(initialUserData);
  const [waitlistState, setWaitlistState] = useState({ total: TOTAL_SLOTS, joined: 0 });
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "users"), where("hasCompletedZealyTasks", "==", true));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const joinedCount = querySnapshot.size;
      setWaitlistState({ total: TOTAL_SLOTS, joined: joinedCount });
    });

    return () => unsubscribe();
  }, []);

  const handleNext = () => setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  const handleBack = () => setStep((prev) => Math.max(prev - 1, 1));
  const jumpToStep = (step: number) => setStep(step);

  const updateUserData = (data: Partial<UserData>) => {
    setUserData((prev) => ({ ...prev, ...data }));
  };
  
  const onConfirm = () => {
    setIsConfirmed(true);
    // Optimistic update for instant feedback
    setWaitlistState(prev => ({...prev, joined: prev.joined + 1}));
  }

  const progress = (step / TOTAL_STEPS) * 100;

  const renderStep = () => {
    switch (step) {
      case 1:
        return <Step1Welcome onNext={handleNext} waitlistState={waitlistState} updateUserData={updateUserData} referralCode={referralCode} />;
      case 2:
        return <Step2Profile onNext={handleNext} onBack={handleBack} userData={userData} updateUserData={updateUserData} />;
      case 3:
        return <Step3Phone onNext={handleNext} onBack={handleBack} userData={userData} updateUserData={updateUserData} />;
      case 4:
        return <Step4Confirm onNext={handleNext} onBack={handleBack} userData={userData} jumpToStep={jumpToStep} />;
      case 5:
        return <Step5Facial onNext={handleNext} onBack={handleBack} />;
      case 6:
        return <Step6Zealy onConfirm={onConfirm} onBack={handleBack} />;
      default:
        return <Step1Welcome onNext={handleNext} waitlistState={waitlistState} updateUserData={updateUserData} referralCode={referralCode}/>;
    }
  };

  return (
    <>
      <div className="w-full max-w-2xl rounded-2xl p-0.5 glowing-border animate-subtle-float">
        <Card className="w-full h-full bg-card neumorphism-outset-heavy border-0">
          <CardHeader>
            <CardTitle className="font-headline text-3xl text-center text-foreground/90 tracking-wider">
              Clocklayer Waitlist
            </CardTitle>
            <CardDescription className="text-center">
              Follow the steps to secure your spot.
            </CardDescription>
            <div className="pt-4">
              <Progress value={progress} className="h-2 bg-primary/20" />
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                  <span key={i} className={`w-1/6 text-center ${i + 1 <= step ? 'font-bold text-primary-foreground' : ''}`}>
                    {i + 1}
                  </span>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="min-h-[400px]">
            {renderStep()}
          </CardContent>
        </Card>
      </div>
      <WaitlistConfirmationDialog isOpen={isConfirmed} userData={userData} />
    </>
  );
}

const Step1Welcome: FC<{ onNext: () => void, waitlistState: { total: number, joined: number }, updateUserData: (data: Partial<UserData>) => void, referralCode: string | null }> = ({ onNext, waitlistState, updateUserData, referralCode }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleConnect = async () => {
    setIsLoading(true);
    const provider = new TwitterAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const additionalUserInfo = getAdditionalUserInfo(result);
      
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists() && userDoc.data().hasCompletedZealyTasks) {
          toast({ title: "Welcome back!", description: "Redirecting you to the dashboard." });
          router.push('/dashboard');
          return;
      }

      const name = user.displayName || 'Pioneer';
      const username = additionalUserInfo?.username || `pioneer_${user.uid.substring(0, 4)}`;
      const profilePicture = user.photoURL ? `${user.photoURL.replace('_normal', '')}` : null;
      const userAgent = navigator.userAgent;

      const userDataForDb: any = {
        uid: user.uid,
        name: name,
        username: username,
        profilePicture: profilePicture,
        lastLogin: serverTimestamp(),
        signupUserAgent: userAgent,
      };

      if (!userDoc.exists()) {
        userDataForDb.createdAt = serverTimestamp();
        if (referralCode) {
          const q = query(collection(db, "users"), where("username", "==", referralCode), limit(1));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
              const referrerDoc = querySnapshot.docs[0];
              userDataForDb.referredBy = referrerDoc.id;
          }
        }
      }
      
      await setDoc(doc(db, "users", user.uid), userDataForDb, { merge: true });

      updateUserData({ name, username, profilePicture });
      onNext();
    } catch (error: any) {
      console.error("X Sign-in error:", error);
      toast({
        title: "Sign-In Failed",
        description: error.code === 'auth/account-exists-with-different-credential' 
          ? "An account already exists with the same email address. Please sign in with the original method."
          : (error.message || "Could not connect with X. Please try again."),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-headline font-semibold mb-4">Join the Exclusive Waitlist</h2>
        <p className="text-muted-foreground mb-6">Connect your X account to begin the journey. Only the dedicated will ascend.</p>
        <div className="flex justify-center gap-4 text-center mb-8">
          <div className="p-4 rounded-lg neumorphism-outset-heavy">
            <div className="text-2xl font-bold font-headline text-primary">{waitlistState.total.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total Slots</div>
          </div>
          <div className="p-4 rounded-lg neumorphism-outset-heavy">
            <div className="text-2xl font-bold font-headline text-accent">{waitlistState.joined.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Joined</div>
          </div>
          <div className="p-4 rounded-lg neumorphism-outset-heavy">
            <div className="text-2xl font-bold font-headline text-primary">{(waitlistState.total - waitlistState.joined).toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Remaining</div>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-center gap-4">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-pink-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
          <Button size="lg" className="relative w-full max-w-xs rounded-full shadow-lg bg-background text-foreground" onClick={handleConnect} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <TwitterIcon className="mr-2 h-5 w-5" />}
            {isLoading ? "Connecting..." : "Join Waitlist with X"}
          </Button>
        </div>
        <Button onClick={handleConnect} variant="link" className="text-muted-foreground" disabled={isLoading}>
           <LogIn className="mr-2 h-4 w-4"/>
           Already registered? Login
        </Button>
      </div>
    </div>
  );
};

const Step2Profile: FC<{ onNext: () => void; onBack: () => void; userData: UserData; updateUserData: (data: Partial<UserData>) => void }> = ({ onNext, onBack, userData, updateUserData }) => {
  const [name, setName] = useState(userData.name);
  const [username, setUsername] = useState(userData.username);
  const [imagePreview, setImagePreview] = useState<string | null>(userData.profilePicture);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setName(userData.name);
    setUsername(userData.username);
    setImagePreview(userData.profilePicture);
  }, [userData]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    const currentUser = auth.currentUser;
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "Please go back and connect your X account.", variant: "destructive" });
      setIsUploading(false);
      return;
    }

    try {
      let finalImageUrl = userData.profilePicture;

      if (imageFile) {
        const filePath = `profile_pictures/${currentUser.uid}/${imageFile.name}`;
        const fileRef = storageRef(storage, filePath);
        await uploadBytes(fileRef, imageFile);
        finalImageUrl = await getDownloadURL(fileRef);
      }

      const updatedData = {
        name,
        username,
        profilePicture: finalImageUrl,
      };

      await updateDoc(doc(db, "users", currentUser.uid), updatedData);
      
      updateUserData(updatedData);
      onNext();

    } catch (error) {
      console.error("Profile update error:", error);
      toast({ title: "Upload Failed", description: "Could not update your profile. Please try again.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center h-full text-center">
        <h2 className="text-2xl font-headline font-semibold mb-2">Hello, {userData.name || 'Pioneer'}!</h2>
        <p className="text-muted-foreground mb-8">Let's set up your identity.</p>
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="w-32 h-32 neumorphism-outset-heavy p-1 cursor-pointer glowing-border" onClick={() => fileInputRef.current?.click()}>
            <div className="relative w-full h-full rounded-full overflow-hidden">
             <AvatarImage src={imagePreview ?? undefined} alt="Profile picture" className="z-10 object-cover" />
              <AvatarFallback className="bg-transparent z-10">
                <Camera className="w-12 h-12 text-primary/80" />
              </AvatarFallback>
            </div>
          </Avatar>
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />
          <Button type="button" variant="ghost" onClick={() => fileInputRef.current?.click()}>Upload Portrait</Button>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-left flex items-center gap-2"><User size={16}/> Full Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Jane Doe" className="neumorphism-inset-heavy" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username" className="text-left flex items-center gap-2"><TwitterIcon size={16}/> Username</Label>
            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="e.g. @janedoe" className="neumorphism-inset-heavy" />
          </div>
        </div>
        <div className="flex justify-between w-full">
          <Button type="button" variant="outline" onClick={onBack} className="neumorphism-outset-heavy" disabled={isUploading}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
          <Button type="submit" className="neumorphism-outset-heavy bg-primary text-primary-foreground" disabled={isUploading}>
            {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Next'}
            {isUploading ? '' : <ArrowRight className="ml-2 h-4 w-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
};

const Step3Phone: FC<{ onNext: () => void; onBack: () => void; userData: UserData; updateUserData: (data: Partial<UserData>) => void }> = ({ onNext, onBack, userData, updateUserData }) => {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const { toast } = useToast();

  const setupRecaptcha = useCallback(() => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': () => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        },
        'expired-callback': () => {
          // Response expired. Ask user to solve reCAPTCHA again.
           toast({ title: "reCAPTCHA expired", description: "Please try sending the code again.", variant: "destructive" });
        }
      });
    }
  }, [toast]);

  useEffect(() => {
    setupRecaptcha();
  }, [setupRecaptcha]);

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (!phone) {
        toast({ title: "Phone number is required.", variant: "destructive" });
        return;
    }
    
    const appVerifier = (window as any).recaptchaVerifier;

    try {
        const result = await signInWithPhoneNumber(auth, phone, appVerifier);
        setConfirmationResult(result);
        setIsOtpSent(true);
        toast({ title: "OTP Sent", description: `A verification code has been sent to ${phone}.` });
    } catch (error: any) {
        console.error("SMS not sent error:", error);
        toast({ title: "Failed to send OTP", description: error.message || "Please check the phone number and try again.", variant: "destructive" });
        if ((window as any).grecaptcha) {
            const widgetId = appVerifier.widgetId;
            (window as any).grecaptcha.reset(widgetId);
        }
    }
  }

  const handleVerify = async (e: FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) {
        toast({ title: "Verification failed", description: "Please request a new OTP.", variant: "destructive"});
        return;
    }
    if (!otp) {
        toast({ title: "OTP is required.", variant: "destructive" });
        return;
    }

    setIsVerifying(true);
    try {
        await confirmationResult.confirm(otp);
        // User signed in successfully.
        const currentUser = auth.currentUser;
        if (!currentUser) {
            throw new Error("Not authenticated!");
        }

        await updateDoc(doc(db, "users", currentUser.uid), { phone });
        updateUserData({ phone });
        toast({ title: "Phone number verified!", className: "bg-accent text-accent-foreground" });
        onNext();

    } catch (error: any) {
        console.error("Phone verification error:", error);
        toast({ title: "Invalid OTP", description: "The code you entered is incorrect. Please try again.", variant: "destructive" });
    } finally {
        setIsVerifying(false);
    }
  }

  return (
    <div className="flex flex-col items-center h-full text-center">
      <div id="recaptcha-container"></div>
      <h2 className="text-2xl font-headline font-semibold mb-2">Verify Your Phone</h2>
      <p className="text-muted-foreground mb-8">For security and authenticity.</p>
      {!isOtpSent ? (
        <form onSubmit={handleSendOtp} className="w-full max-w-sm space-y-6">
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-left flex items-center gap-2"><Phone size={16}/> Phone Number</Label>
            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="+1 234 567 890" className="neumorphism-inset-heavy" />
          </div>
          <div className="flex justify-between w-full">
            <Button type="button" variant="outline" onClick={onBack} className="neumorphism-outset-heavy"><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
            <Button type="submit" className="neumorphism-outset-heavy bg-primary text-primary-foreground">Send Code<ArrowRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </form>
      ) : (
        <form onSubmit={handleVerify} className="w-full max-w-sm space-y-6">
          <p className="text-sm text-muted-foreground">Enter the 6-digit code sent to {phone}.</p>
          <div className="space-y-2">
            <Label htmlFor="otp">Verification Code</Label>
            <Input id="otp" value={otp} onChange={(e) => setOtp(e.target.value)} required maxLength={6} className="neumorphism-inset-heavy" />
          </div>
          <div className="flex justify-between w-full">
            <Button type="button" variant="ghost" onClick={() => setIsOtpSent(false)}>Change Number</Button>
            <Button type="submit" className="neumorphism-outset-heavy bg-primary text-primary-foreground" disabled={isVerifying}>
                {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                {isVerifying ? 'Verifying...' : 'Verify'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

const Step4Confirm: FC<{ onNext: () => void; onBack: () => void; userData: UserData; jumpToStep: (step: number) => void }> = ({ onNext, onBack, userData, jumpToStep }) => {
  return (
    <div className="flex flex-col items-center h-full text-center">
      <h2 className="text-2xl font-headline font-semibold mb-2">Confirm Your Identity</h2>
      <p className="text-muted-foreground mb-8">One final look before we proceed.</p>
      <div className="w-full max-w-md space-y-6 neumorphism-inset-heavy p-6 rounded-lg">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 neumorphism-outset-heavy p-0.5 glowing-border">
                  <div className="relative w-full h-full rounded-full overflow-hidden">
                    <AvatarImage src={userData.profilePicture ?? undefined} />
                    <AvatarFallback className="bg-transparent"><User /></AvatarFallback>
                  </div>
                </Avatar>
                <div>
                    <p className="font-semibold">{userData.name}</p>
                    <p className="text-sm text-muted-foreground">{userData.username}</p>
                </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => jumpToStep(2)}><Edit className="mr-2 h-3 w-3" />Edit</Button>
        </div>
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
                <Phone className="w-6 h-6 text-muted-foreground"/>
                <p>{userData.phone}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => jumpToStep(3)}><Edit className="mr-2 h-3 w-3" />Edit</Button>
        </div>
      </div>
      <div className="flex justify-between w-full mt-8 max-w-md">
        <Button type="button" variant="outline" onClick={onBack} className="neumorphism-outset-heavy"><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
        <Button onClick={onNext} className="neumorphism-outset-heavy bg-primary text-primary-foreground">Confirm &amp; Proceed<ArrowRight className="ml-2 h-4 w-4" /></Button>
      </div>
    </div>
  );
};

const Step5Facial: FC<{ onNext: () => void; onBack: () => void }> = ({ onNext, onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraAccess, setHasCameraAccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const { toast } = useToast();

  const setupCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasCameraAccess(true);
    } catch (err) {
      console.error("Camera access denied:", err);
      toast({ title: "Camera Access Denied", description: "Please allow camera access to continue.", variant: "destructive" });
      setHasCameraAccess(false);
    }
  }, [toast]);

  useEffect(() => {
    setupCamera();
    return () => {
      // Stop camera stream on component unmount
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [setupCamera]);

  const handleVerify = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsVerifying(true);
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    
    if (context) {
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      const faceDataUri = canvas.toDataURL('image/jpeg');

      try {
        const result = await verifyHuman({ faceDataUri });
        if (result.isHuman && result.confidence > 0.7) {
          toast({ title: "Human Verified!", description: `Confidence: ${(result.confidence * 100).toFixed(0)}%`, className: "bg-accent text-accent-foreground" });
          onNext();
        } else {
          toast({ title: "Verification Failed", description: "Could not verify you as a human. Please try again.", variant: "destructive" });
        }
      } catch (error) {
        console.error(error);
        toast({ title: "An Error Occurred", description: "Something went wrong during verification.", variant: "destructive" });
      } finally {
        setIsVerifying(false);
      }
    } else {
       toast({ title: "Canvas Error", description: "Could not process video frame.", variant: "destructive" });
       setIsVerifying(false);
    }
  };

  return (
    <div className="flex flex-col items-center h-full text-center">
      <h2 className="text-2xl font-headline font-semibold mb-2">Human Verification</h2>
      <p className="text-muted-foreground mb-4">Please position your face in the frame.</p>
      <div className="w-full max-w-sm aspect-square bg-muted rounded-lg overflow-hidden relative neumorphism-inset-heavy p-2 glowing-border">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-md z-10 scale-x-[-1]" />
        <canvas ref={canvasRef} className="hidden" />
        {!hasCameraAccess && <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white z-20">Requesting camera...</div>}
      </div>
      <div className="flex justify-between w-full mt-8 max-w-sm">
        <Button type="button" variant="outline" onClick={onBack} disabled={isVerifying} className="neumorphism-outset-heavy"><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
        <Button onClick={handleVerify} disabled={!hasCameraAccess || isVerifying} className="neumorphism-outset-heavy bg-primary text-primary-foreground">
          {isVerifying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
          {isVerifying ? 'Verifying...' : 'Verify Me'}
        </Button>
      </div>
    </div>
  );
};

const MINIMUM_XP_REQUIRED = 2000;

const Step6Zealy: FC<{ onConfirm: () => void; onBack: () => void; }> = ({ onConfirm, onBack }) => {
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(false);
  const zealyInitialized = useRef(false);
  const zealyQuestboardUrl = "https://zealy.io/cw/clocklayer/questboard/63d4c95e-bcc3-460d-8ed2-0c86812d6f16";

  const handleZealyConnect = () => {
    const zealy = (window as any).zealy;
    if (zealy) {
      zealy.connect();
    } else {
      toast({ title: "Zealy Not Loaded", description: "The Zealy script hasn't loaded yet. Please wait a moment and try again.", variant: "destructive" });
    }
  };

  const handleScriptLoad = () => {
    const zealy = (window as any).zealy;
    if (zealy && !zealyInitialized.current) {
      zealy.init(process.env.NEXT_PUBLIC_ZEALY_API_KEY);
      
      zealy.on('connect', async (user: { id: string; xp: number }) => {
        setIsVerifying(true);
        try {
          if (user.xp >= MINIMUM_XP_REQUIRED) {
            const currentUser = auth.currentUser;
            if (!currentUser) {
              toast({ title: "Authentication Error", description: "You must be signed in.", variant: "destructive" });
              setIsVerifying(false);
              return;
            }
            
            const result = await confirmZealyTasks({ uid: currentUser.uid, zealyId: user.id, xp: user.xp });
            
            if (result.success) {
              toast({ title: "Success!", description: `Verified with ${user.xp} XP. You're on the waitlist!`, className: "bg-accent text-accent-foreground" });
              onConfirm();
            } else {
              throw new Error(result.message);
            }

          } else {
            toast({ title: "Not enough XP", description: `You have ${user.xp} XP, but you need ${MINIMUM_XP_REQUIRED}. Please complete more tasks on Zealy.`, variant: "destructive" });
          }
        } catch (error: any) {
          console.error("Zealy verification error:", error);
          toast({ title: "An Error Occurred", description: error.message || "Could not complete Zealy verification.", variant: "destructive" });
        } finally {
          setIsVerifying(false);
        }
      });

      zealyInitialized.current = true;
    }
  };


  return (
    <>
      <Script 
        src="https://widget.zealy.io/connect.js" 
        onLoad={handleScriptLoad}
        onError={() => toast({ title: 'Zealy script failed to load', description: 'Please check your connection or ad-blocker.', variant: 'destructive'})}
        async 
      />
      <div className="flex flex-col items-center h-full text-center">
        <h2 className="text-2xl font-headline font-semibold mb-2">The Final Ascent</h2>
        <p className="text-muted-foreground mb-8">Complete quests on Zealy to earn {MINIMUM_XP_REQUIRED} XP and secure your spot.</p>
        
        <div className="w-full max-w-md space-y-6 neumorphism-inset-heavy p-6 rounded-lg text-left mb-8">
            <div className="flex items-start gap-4">
                <div className="font-bold text-lg text-primary">1.</div>
                <div>
                    <h3 className="font-semibold">Complete Quests on Zealy</h3>
                     <p className="text-sm text-muted-foreground mt-1 mb-4">Click the button below to be redirected to our Zealy questboard. You will need to complete several tasks to earn a total of {MINIMUM_XP_REQUIRED} XP.</p>
                    <ul className="list-disc list-outside text-sm text-muted-foreground space-y-2 pl-4 mb-4">
                        <li>Access the "Clock Layer Testnet Airdrop" module.</li>
                        <li>Connect your wallet and Telegram account.</li>
                        <li>Complete the "Genesis Waitlist Integration" quests to claim 1,000 XP.</li>
                        <li>Complete the "Genesis Waitlist Tasks Completion" quests to claim another 1,000 XP.</li>
                    </ul>
                    <Button asChild variant="outline" className="neumorphism-outset-heavy">
                        <a href={zealyQuestboardUrl} target="_blank" rel="noopener noreferrer">
                           Go to Zealy Questboard <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                    </Button>
                </div>
            </div>
             <div className="flex items-start gap-4">
                <div className="font-bold text-lg text-primary">2.</div>
                <div>
                    <h3 className="font-semibold">Verify Your Status</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        After completing the quests and claiming your XP on Zealy, return here and click the "Connect with Zealy" button below to verify your status and join the waitlist.
                    </p>
                     <div className="relative group w-fit">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400 to-cyan-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                        <Button className="relative rounded-full shadow-lg bg-background text-foreground" onClick={handleZealyConnect} disabled={isVerifying}>
                             {isVerifying ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Rocket className="mr-2 h-5 w-5" />}
                             {isVerifying ? 'Verifying...' : 'Connect with Zealy'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>

        <div className="flex justify-between w-full mt-2 max-w-md">
          <Button type="button" variant="outline" onClick={onBack} disabled={isVerifying} className="neumorphism-outset-heavy"><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
        </div>
      </div>
    </>
  );
};

const WaitlistConfirmationDialog: FC<{ isOpen: boolean; userData: UserData; }> = ({ isOpen, userData }) => {
    const router = useRouter();
    return (
        <Dialog open={isOpen}>
            <DialogContent className="max-w-md w-full rounded-2xl flex flex-col items-center justify-center text-center p-10 bg-background neumorphism-outset-heavy glowing-border">
                <div className="z-10 flex flex-col items-center justify-center">
                    <CheckCircle2 className="w-16 h-16 text-accent mb-4"/>
                    <h2 className="text-2xl font-headline font-semibold mb-4">Congratulations!</h2>
                    <Avatar className="w-24 h-24 neumorphism-outset-heavy p-1 mb-4 glowing-border">
                        <div className="relative w-full h-full rounded-full overflow-hidden">
                            <AvatarImage src={userData.profilePicture ?? undefined} />
                            <AvatarFallback className="bg-transparent"><User /></AvatarFallback>
                        </div>
                    </Avatar>
                    <p className="font-semibold text-lg">{userData.name}</p>
                    <p className="text-muted-foreground">{userData.username}</p>
                    <p className="mt-4">You have successfully joined the waitlist.</p>

                    <Button onClick={() => router.push('/dashboard')} className="mt-8 rounded-full neumorphism-outset-heavy bg-accent text-accent-foreground">
                        Go to Dashboard
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
