
import type { Metadata } from 'next';
import { Lexend_Deca } from 'next/font/google';
import Link from 'next/link';
import { Toaster } from "@/components/ui/toaster";
import { Button } from '@/components/ui/button';
import './globals.css';
import { Rocket, FileText, Presentation, Twitter } from 'lucide-react';

const lexendDeca = Lexend_Deca({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-lexend-deca',
});

export const metadata: Metadata = {
  title: 'ClocklayerWaitlist',
  description: 'Join the waitlist for the Clocklayer platform.',
};

function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-transparent">
      <nav className="container mx-auto flex items-center justify-between p-4 flex-wrap gap-2 md:gap-4">
        <Link href="/" className="text-2xl font-bold font-headline text-primary">
          Clocklayer
        </Link>
        <div className="flex items-center gap-2 md:gap-4 order-last w-full md:w-auto md:order-none">
          <Button asChild variant="ghost" className="glassmorphism text-foreground flex-grow md:flex-grow-0">
            <Link href="/">Home</Link>
          </Button>
          <Button asChild variant="ghost" className="glassmorphism text-foreground flex-grow md:flex-grow-0">
            <Link href="/contact">Contact</Link>
          </Button>
        </div>
         <Button asChild className="glassmorphism text-foreground">
            <Link href="/waitlist">
              <Rocket className="mr-2 h-4 w-4" />
              Join Waitlist
            </Link>
          </Button>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-transparent p-4">
        <div className="container mx-auto flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
            <Button asChild variant="ghost" className="glassmorphism text-foreground text-xs sm:text-sm">
                <a href="https://medium.com/@jesusmichael.itechempire/whitepaper-9f388211b769" target="_blank" rel="noopener noreferrer">
                    <FileText className="mr-2 h-4 w-4" />
                    White paper
                </a>
            </Button>
            <Button asChild variant="ghost" className="glassmorphism text-foreground text-xs sm:text-sm">
                <a href="https://www.papermark.com/view/cmdmurjle0006lg04olk1ppcd" target="_blank" rel="noopener noreferrer">
                    <Presentation className="mr-2 h-4 w-4" />
                    Pitch Deck
                </a>
            </Button>
            <Button asChild variant="ghost" className="glassmorphism text-foreground text-xs sm:text-sm">
                <a href="https://twitter.com/clocklayer1" target="_blank" rel="noopener noreferrer">
                    <Twitter className="mr-2 h-4 w-4" />
                    Twitter
                </a>
            </Button>
        </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${lexendDeca.variable} font-body antialiased`}>
        <Header />
        <main>
          {children}
        </main>
        <Footer />
        <Toaster />
      </body>
    </html>
  );
}
