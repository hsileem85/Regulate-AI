import { lazy } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import { Layout } from './components/layout';
import FraDashboard from './pages/fra/Dashboard';
import FraReports from './pages/fra/ReportsList';
import ReportBuilder from './pages/fra/ReportBuilder';
import ReportDetail from './pages/fra/ReportDetail';
import FraMonitor from './pages/fra/Monitor';

// Company portal placeholders
import CompanyDashboard from './pages/company/Dashboard';
import CompanyInbox from './pages/company/Inbox';
import RequestDetail from './pages/company/RequestDetail';
import Workspace from './pages/company/Workspace';
import Receipt from './pages/company/Receipt';

const Placeholder = ({ name }: { name: string }) => <div className="p-8 text-center text-muted-foreground">{name} (Building...)</div>;

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/fra/dashboard" component={FraDashboard} />
      <Route path="/fra/reports" component={FraReports} />
      <Route path="/fra/reports/new" component={ReportBuilder} />
      <Route path="/fra/reports/:id" component={ReportDetail} />
      <Route path="/fra/monitor" component={FraMonitor} />
      <Route path="/fra/companies" component={() => <Placeholder name="Companies" />} />
      
      <Route path="/company/dashboard" component={CompanyDashboard} />
      <Route path="/company/inbox" component={CompanyInbox} />
      <Route path="/company/requests/:id" component={RequestDetail} />
      <Route path="/company/requests/:id/workspace" component={Workspace} />
      <Route path="/company/requests/:id/receipt" component={Receipt} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, '') || ''}>
          <Layout>
            <Router />
          </Layout>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
