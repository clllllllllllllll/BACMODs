import Link from "next/link";
import ContextPill from "@/components/layout/ContextPill";

export default function Header({ showContext = true }: { showContext?: boolean }) {
  return (
    <header className="flex h-14 items-center justify-between bg-card px-4">
      <Link href="/" className="focus-ring rounded-chip text-wordmark text-fg">
        BACMODS
      </Link>
      {showContext ? <ContextPill /> : null}
    </header>
  );
}
