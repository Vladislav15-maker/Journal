
import { SidebarTrigger } from "@/components/ui/sidebar";

type HeaderProps = {
  children?: React.ReactNode;
}

export function Header({ children }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <SidebarTrigger className="md:hidden" />
      <div className="w-full flex items-center gap-4">
        {children}
      </div>
    </header>
  );
}
