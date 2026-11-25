import Header from "@/components/layout/Header";
import RequireSetup from "@/components/layout/RequireSetup";
import { COLUMN } from "@/components/layout/column";
import TabBar from "@/components/layout/TabBar";

/**
 * Shared page shell. On phone and tablet the tab bar is a second row under the Header;
 * on desktop the tabs sit inside the Header. Setup keeps a compact column.
 */
export default function AppFrame({ children }: { children: React.ReactNode }) {
  return (
    <RequireSetup>
      <Frame withTabs>{children}</Frame>
    </RequireSetup>
  );
}

export function SetupFrame({ children }: { children: React.ReactNode }) {
  return <Frame withTabs={false}>{children}</Frame>;
}

function Frame({ children, withTabs }: { children: React.ReactNode; withTabs: boolean }) {
  return (
    <div className="flex min-h-dvh flex-col bg-page">
      <Header showContext={withTabs} />
      {withTabs ? (
        <div className="border-b border-line bg-card lg:hidden">
          <div className={`${COLUMN} lg:px-0`}>
            <TabBar />
          </div>
        </div>
      ) : null}
      <main
        className={`flex flex-1 flex-col gap-4 px-4 pb-24 pt-4 ${withTabs ? `${COLUMN} lg:pt-6` : "mx-auto w-full max-w-120"}`}
      >
        {children}
      </main>
    </div>
  );
}
