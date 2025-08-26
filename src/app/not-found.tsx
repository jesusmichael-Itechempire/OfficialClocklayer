
"use client";

import { Button } from "@/components/ui/button";
import { Home, ServerCrash } from "lucide-react";
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center p-4 text-center">
        <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:6rem_4rem]">
            <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_800px_at_50%_200px,hsl(var(--primary)/0.1),transparent)]"></div>
        </div>
        <div className="w-full max-w-md animate-subtle-float">
            <div className="w-full p-0.5 glowing-border rounded-2xl bg-transparent">
                <div className="relative w-full h-full rounded-2xl p-8 md:p-12 bg-card/80 backdrop-blur-sm neumorphism-inset-heavy">
                     <ServerCrash className="w-20 h-20 text-destructive mx-auto mb-6" />
                     <h1 className="text-4xl font-bold font-headline">404 - Page Not Found</h1>
                     <p className="text-muted-foreground mt-4 mb-8">
                         The page you are looking for does not exist. It might have been moved, renamed, or is temporarily unavailable.
                     </p>
                    <Link href="/">
                       <Button className="neumorphism-outset-heavy bg-primary text-primary-foreground">
                          <Home className="mr-2 h-4 w-4" /> Go Back to Home
                       </Button>
                    </Link>
                </div>
            </div>
        </div>
    </div>
  );
}
