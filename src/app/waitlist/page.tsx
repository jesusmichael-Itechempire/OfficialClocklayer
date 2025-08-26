
"use client";

import { SignUpFlow } from "@/components/signup-flow";
import { useSearchParams } from 'next/navigation'
import { Suspense } from "react";

function WaitlistContent() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref');

  return (
    <main className="relative flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:6rem_4rem]">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_800px_at_50%_200px,hsl(var(--primary)/0.1),transparent)]"></div>
      </div>
      <SignUpFlow referralCode={refCode} />
    </main>
  );
}


export default function WaitlistPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <WaitlistContent />
    </Suspense>
  );
}

