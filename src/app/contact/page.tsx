
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Mail, Send, User, MessageSquare, Briefcase, Home } from "lucide-react";
import Link from 'next/link';
import { useState, type FormEvent, useEffect } from "react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    title: "",
    message: "",
  });
  const [isSent, setIsSent] = useState(false);
  const [mailtoLink, setMailtoLink] = useState("");
  const { toast } = useToast();

  const isFormValid = formData.fullName && formData.email && formData.title && formData.message;

  useEffect(() => {
    if (isFormValid) {
       const newMailtoLink = `mailto:jesusmichael.clock@gmail.com?subject=${encodeURIComponent(
        `Contact Form: ${formData.title}`
      )}&body=${encodeURIComponent(
        `Name: ${formData.fullName}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`
      )}`;
      setMailtoLink(newMailtoLink);
    } else {
      setMailtoLink("");
    }
  }, [formData, isFormValid]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleClickSend = () => {
    if (!isFormValid) {
       toast({
        title: "Missing Fields",
        description: "Please fill out all the required fields.",
        variant: "destructive",
      });
      return;
    }
    // We can't know for sure if the email was sent, but we can assume it was
    // after triggering the mailto link.
    setTimeout(() => {
        setIsSent(true);
    }, 1500);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background font-body text-foreground">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:6rem_4rem]">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_800px_at_50%_200px,hsl(var(--primary)/0.1),transparent)]"></div>
      </div>
      <main className="flex min-h-screen w-full flex-col items-center justify-center p-4">
        <div className="w-full max-w-3xl space-y-8 animate-subtle-float">
          <div className="w-full p-0.5 glowing-border rounded-2xl bg-transparent">
            <div className="relative w-full h-full rounded-2xl p-8 md:p-12 bg-card/80 backdrop-blur-sm neumorphism-inset-heavy">
              {isSent ? (
                <div className="flex flex-col items-center justify-center text-center h-full min-h-[400px]">
                  <CheckCircle2 className="w-20 h-20 text-accent mb-6 animate-subtle-float" />
                  <h2 className="text-3xl font-headline font-bold mb-4">Message Sent!</h2>
                  <p className="text-muted-foreground max-w-md">
                    Thank you for reaching out. Your email client should now be open. Once you send the message, we will get back to you as soon as possible.
                  </p>
                   <div className="flex flex-col sm:flex-row gap-4 mt-8">
                     <Button onClick={() => setIsSent(false)} className="neumorphism-outset-heavy">
                      Send Another Message
                    </Button>
                    <Link href="/">
                       <Button variant="outline" className="w-full neumorphism-outset-heavy">
                          <Home className="mr-2 h-4 w-4" /> Return to Home
                       </Button>
                    </Link>
                   </div>
                </div>
              ) : (
                <>
                  <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold font-headline">Contact Us</h1>
                    <p className="text-muted-foreground mt-2">
                      Have a question or feedback? We'd love to hear from you.
                    </p>
                  </div>
                  <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <Label htmlFor="fullName" className="flex items-center gap-2"><User size={16} /> Full Name</Label>
                        <Input id="fullName" value={formData.fullName} onChange={handleChange} required className="neumorphism-inset-heavy" placeholder="Jane Doe"/>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="flex items-center gap-2"><Mail size={16} /> Email Address</Label>
                        <Input id="email" type="email" value={formData.email} onChange={handleChange} required className="neumorphism-inset-heavy" placeholder="jane@example.com"/>
                      </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="title" className="flex items-center gap-2"><Briefcase size={16} /> Title / Subject</Label>
                        <Input id="title" value={formData.title} onChange={handleChange} required className="neumorphism-inset-heavy" placeholder="Regarding..."/>
                      </div>
                    <div className="space-y-2">
                      <Label htmlFor="message" className="flex items-center gap-2"><MessageSquare size={16} /> Message</Label>
                      <Textarea id="message" value={formData.message} onChange={handleChange} required className="neumorphism-inset-heavy min-h-[150px]" placeholder="Your message here..."/>
                    </div>
                    <div className="text-center">
                        <a href={isFormValid ? mailtoLink : undefined} onClick={handleClickSend}>
                          <Button asChild={false} disabled={!isFormValid} type="button" className="w-full max-w-xs neumorphism-outset-heavy bg-primary text-primary-foreground py-6 text-lg disabled:opacity-50 disabled:cursor-not-allowed">
                              <div><Send className="mr-2 h-5 w-5" /> Send Message</div>
                          </Button>
                        </a>
                    </div>
                  </form>
                   <p className="text-center text-sm text-muted-foreground mt-8">
                        For a faster response, you can also email us directly at{' '}
                        <a href="mailto:jesusmichael.clock@gmail.com" className="text-primary hover:underline font-semibold">
                            jesusmichael.clock@gmail.com
                        </a>.
                    </p>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
