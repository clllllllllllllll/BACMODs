import Link from "next/link";
import { COLUMN } from "@/components/layout/column";
import ContextPill from "@/components/layout/ContextPill";
import TabBar from "@/components/layout/TabBar";

export default function Header({ showContext = true }: { showContext?: boolean }) {
  return (
    <header className="bg-card">
      <div className={`${COLUMN} flex h-14 items-center justify-between gap-6 px-4`}>
        <div className="flex items-center gap-8">
          <Link href="/" className="focus-ring rounded-chip text-wordmark text-fg">
            BACMODS
          </Link>
          {/* Desktop only: the tabs join the Header row. */}
          {showContext ? (
            <div className="hidden lg:block">
              <TabBar inline />
            </div>
          ) : null}
        </div>
        {showContext ? <ContextPill /> : null}
      </div>
    </header>
  );
}
