import React, { useState, useMemo } from 'react';
import { useListCompanies } from '@workspace/api-client-react';
import { Building2, Search, Filter, Mail, User, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const DOMAINS = [
  { value: 'all', label: 'All Domains' },
  { value: 'brokerage', label: 'Brokerage' },
  { value: 'asset_management', label: 'Asset Management' },
  { value: 'financing', label: 'Financing' },
  { value: 'leasing', label: 'Leasing' },
  { value: 'factoring', label: 'Factoring' },
  { value: 'fintech_bnpl', label: 'Fintech & BNPL' },
  { value: 'other', label: 'Other' },
] as const;

export default function FraCompanies() {
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const { data: companies, isLoading } = useListCompanies(
    domainFilter !== 'all' ? { domain: domainFilter } : undefined
  );

  const filtered = useMemo(() => {
    if (!companies) return [];
    const term = search.toLowerCase().trim();
    return term
      ? companies.filter(
          (c) =>
            c.name.toLowerCase().includes(term) ||
            c.email.toLowerCase().includes(term) ||
            c.contactPerson.toLowerCase().includes(term)
        )
      : companies;
  }, [companies, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const c of filtered) {
      if (!map.has(c.domain)) map.set(c.domain, []);
      map.get(c.domain)!.push(c);
    }
    return map;
  }, [filtered]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Regulated Entities</h1>
          <p className="text-muted-foreground mt-1">
            Companies under FRA oversight, grouped by regulated domain.
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> Register Entity
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 bg-card p-4 rounded-xl border border-border/50">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or contact person..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <div className="flex gap-1 flex-wrap">
            {DOMAINS.map((d) => (
              <button
                key={d.value}
                onClick={() => setDomainFilter(d.value)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-colors border',
                  domainFilter === d.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:text-foreground'
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="border-border/50">
              <CardHeader className="pb-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-border rounded-xl bg-card p-12 text-center text-muted-foreground">
          <Building2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p>No regulated entities match your filters.</p>
        </div>
      ) : domainFilter === 'all' ? (
        Array.from(grouped.entries()).map(([domain, list]) => (
          <div key={domain} className="space-y-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold capitalize">{domain.replace(/_/g, ' ')}</h2>
              <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                {list.length} entities
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {list.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>
          </div>
        ))
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((company) => (
            <CompanyCard key={company.id} company={company} />
          ))}
        </div>
      )}
    </div>
  );
}

function CompanyCard({ company }: { company: { id: number; name: string; domain: string; email: string; contactPerson: string; createdAt: string } }) {
  return (
    <Card className="border-border/50 hover:border-primary/30 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <span className="text-[10px] uppercase tracking-wider bg-secondary px-2 py-0.5 rounded text-secondary-foreground">
            {company.domain.replace(/_/g, ' ')}
          </span>
        </div>
        <CardTitle className="text-base font-semibold leading-tight mt-2">{company.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Mail className="w-4 h-4" />
          <span className="truncate">{company.email}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="w-4 h-4" />
          <span>{company.contactPerson}</span>
        </div>
      </CardContent>
    </Card>
  );
}
