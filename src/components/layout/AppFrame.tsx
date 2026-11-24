import Header from "@/components/layout/Header";
import TabBar from "@/components/layout/TabBar";

/**
 * Shared page shell: Header, TabBar and one centred column capped at 480 px
 * (the desktop layout is not designed yet).
 */
export default function AppFrame({ children, withTabs = true }: { children: React.ReactNode; withTabs?: boolean }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-120 flex-col bg-page">
      <Header showContext={withTabs} />
      {withTabs ? <TabBar /> : null}
      <main className="flex flex-1 flex-col gap-4 px-4 pb-24 pt-4">{children}</main>
    </div>
  );
}
