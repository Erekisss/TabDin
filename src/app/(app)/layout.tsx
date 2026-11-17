import { Suspense } from "react";
import { MobileHeader, Sidebar, TabBar } from "@/components/Nav";
import { requireUser } from "@/lib/supabase/server";

/**
 * Shell estático (pré-renderizado) + conteúdo dinâmico por usuário em streaming.
 * Com Cache Components, tudo que lê cookies precisa estar dentro de <Suspense>.
 */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Suspense fallback={<SidebarSkeleton />}>
        <UserSidebar />
      </Suspense>
      <MobileHeader />
      <main className="lg:pl-[260px] pb-28 lg:pb-10">
        <div className="mx-auto max-w-6xl px-5 lg:px-8 pt-6 lg:pt-10">
          <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
        </div>
      </main>
      <TabBar />
    </>
  );
}

async function UserSidebar() {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
  const name = profile?.full_name || user.email?.split("@")[0] || "Você";
  return <Sidebar name={name} email={user.email ?? ""} />;
}

function SidebarSkeleton() {
  return (
    <aside className="hidden lg:flex fixed inset-y-0 left-0 w-[260px] p-4">
      <div className="glass rounded-[28px] flex-1" />
    </aside>
  );
}

function PageSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 w-24 rounded bg-white/10 mb-3" />
      <div className="h-9 w-56 rounded-xl bg-white/10 mb-8" />
      <div className="h-44 rounded-[28px] bg-white/[0.06] mb-5" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-28 rounded-[22px] bg-white/[0.06]" />
        <div className="h-28 rounded-[22px] bg-white/[0.06]" />
      </div>
    </div>
  );
}
