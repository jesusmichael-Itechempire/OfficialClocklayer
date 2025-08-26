
import { Button } from "@/components/ui/button";
import { Rocket } from "lucide-react";
import Link from 'next/link';
import Image from 'next/image';

export default function HomePage() {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background font-body text-foreground page-background">
      <div className="absolute inset-0 -z-10 h-full w-full bg-black/50">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_800px_at_50%_200px,hsl(var(--primary)/0.1),transparent)]"></div>
      </div>

      <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center p-4">
        <div className="flex flex-col items-center text-center max-w-2xl">
            
            <h1 className="text-5xl md:text-7xl font-bold font-headline leading-tight tracking-tighter animate-subtle-float text-shadow-lg">
              Join the <span className="text-primary">Clocklayer</span> Waitlist
            </h1>
            <p className="mt-6 max-w-xl text-lg text-foreground/80">
              Secure your spot on the waitlist for the next generation of decentralized platforms. Connect, verify, and earn your place among the Clockers.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="neumorphism-outset-heavy glassmorphism text-foreground py-7 text-lg">
                <Link href="/waitlist">
                  <Rocket className="mr-2 h-5 w-5" />
                  Get Started
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="glassmorphism text-foreground py-7 text-lg">
                <Link href="/index.html">
                  Learn More About What We're Building
                </Link>
              </Button>
            </div>
            <div className="mt-10 flex items-center gap-4 text-muted-foreground">
              <div className="flex -space-x-4 overflow-hidden p-1">
                <Image className="inline-block h-10 w-10 rounded-full ring-2 ring-background neumorphism-outset-heavy" src="https://res.cloudinary.com/dqouvpe2s/image/upload/v1755912424/realistic-black-girl-stylized-female-portrait-illustration-with-curly-hair-f1pNYa57_bzffss.jpg" alt="User 1" width={40} height={40}/>
                <Image className="inline-block h-10 w-10 rounded-full ring-2 ring-background neumorphism-outset-heavy" src="https://res.cloudinary.com/dqouvpe2s/image/upload/v1755912425/3d-male-avatar-stylish-animated-boy-with-glasses-and-scarf-cmgFURYw_ejgbfh.jpg" alt="User 2" width={40} height={40}/>
                <Image className="inline-block h-10 w-10 rounded-full ring-2 ring-background neumorphism-outset-heavy" src="https://res.cloudinary.com/dqouvpe2s/image/upload/v1755912425/3d-male-avatar-cartoon-man-with-glasses-Bnq3PC7J_ptuw5m.jpg" alt="User 3" width={40} height={40}/>
              </div>
              <span className="font-semibold text-foreground/70">Join over 10,000+ Clockers</span>
            </div>
        </div>
      </div>
    </div>
  );
}
