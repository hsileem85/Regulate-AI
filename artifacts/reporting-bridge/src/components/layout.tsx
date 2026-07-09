import React from 'react';
import { Link, useLocation } from 'wouter';
import { 
  Building2, 
  ShieldCheck, 
  LayoutDashboard, 
  FileText, 
  Activity, 
  Users, 
  Inbox, 
  LogOut,
  ChevronRight,
  ArrowLeftRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const isFRA = location.startsWith('/fra');
  const isCompany = location.startsWith('/company');

  // If we are at root, redirect to FRA dashboard
  React.useEffect(() => {
    if (location === '/') {
      setLocation('/fra/dashboard');
    }
  }, [location, setLocation]);

  const navItems = isFRA ? [
    { icon: LayoutDashboard, label: 'Control Tower', href: '/fra/dashboard' },
    { icon: FileText, label: 'Reporting Catalogue', href: '/fra/reports' },
    { icon: Activity, label: 'Status Monitor', href: '/fra/monitor' },
    { icon: Users, label: 'Regulated Entities', href: '/fra/companies' },
  ] : [
    { icon: LayoutDashboard, label: 'Overview', href: '/company/dashboard' },
    { icon: Inbox, label: 'Requests Inbox', href: '/company/inbox' },
  ];

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden text-foreground selection:bg-primary/30">
      
      {/* Sidebar */}
      <aside className="w-72 border-r border-border bg-card flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm leading-tight tracking-tight text-foreground">Regulate AI</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Reporting Bridge</span>
            </div>
          </div>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-1">
          <div className="mb-4 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {isFRA ? 'FRA Portal' : 'Entity Portal'}
          </div>
          
          {navItems.map((item) => {
            const isActive = location.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} className="block">
                <div className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all group",
                  isActive 
                    ? "bg-primary/10 text-primary" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}>
                  <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  {item.label}
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto opacity-50" />}
                </div>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-border mt-auto shrink-0 bg-background/50">
          <Button 
            variant="outline" 
            className="w-full justify-start gap-2 border-border hover:bg-muted text-xs text-muted-foreground"
            onClick={() => setLocation(isFRA ? '/company/dashboard' : '/fra/dashboard')}
          >
            <ArrowLeftRight className="w-4 h-4" />
            Switch to {isFRA ? 'Entity' : 'FRA'} Portal
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 border-b border-border bg-card/50 backdrop-blur shrink-0 flex items-center justify-between px-8">
          <div className="flex items-center gap-2">
            {/* Breadcrumb or context could go here */}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 border-l border-border pl-6">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium leading-none">
                  {isFRA ? 'Oversight Officer' : 'Compliance Officer'}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {isFRA ? 'Financial Regulatory Authority' : 'Nexus Capital Markets'}
                </div>
              </div>
              <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center border border-border">
                {isFRA ? <ShieldCheck className="w-4 h-4 text-muted-foreground" /> : <Building2 className="w-4 h-4 text-muted-foreground" />}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
