import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Check, ChevronRight, Save, LayoutGrid, FileCode2, PlayCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useCreateReport, useCreateReportColumn, useCreateReportRule, usePublishReport } from '@workspace/api-client-react';

const STEPS = [
  { id: 1, title: 'Metadata', icon: FileCode2 },
  { id: 2, title: 'Schema Builder', icon: LayoutGrid },
  { id: 3, title: 'Rule Engine', icon: PlayCircle },
  { id: 4, title: 'Review & Publish', icon: ShieldCheck },
];

export default function ReportBuilder() {
  const [step, setStep] = useState(1);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // State: Report
  const [reportId, setReportId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<'ad-hoc'|'daily'|'weekly'|'monthly'|'quarterly'|'annually'>('monthly');
  const [domains, setDomains] = useState<string[]>(['brokerage']);
  
  // State: Columns
  const [columns, setColumns] = useState<{id: number; columnName: string; dataType: string}[]>([]);
  const [colName, setColName] = useState('');
  const [colType, setColType] = useState<'string'|'integer'|'decimal'|'date'|'boolean'|'enum'>('string');
  
  // State: Rules
  const [rules, setRules] = useState<{id: number; columnName: string; ruleType: string}[]>([]);
  
  const createReport = useCreateReport();
  const createColumn = useCreateReportColumn();
  const createRule = useCreateReportRule();
  const publishReport = usePublishReport();

  const handleNext = async () => {
    if (step === 1 && !reportId) {
      if (!name || domains.length === 0) {
        toast({ title: 'Validation Error', description: 'Name and at least one domain are required.', variant: 'destructive' });
        return;
      }
      
      try {
        const res = await createReport.mutateAsync({
          data: {
            name,
            description,
            frequency,
            targetDomains: domains,
            implementationWindowDays: 30
          }
        });
        setReportId(res.id);
        toast({ title: 'Draft created', description: 'Proceeding to schema builder.' });
        setStep(2);
      } catch (e) {
        toast({ title: 'Error', description: 'Failed to create report.', variant: 'destructive' });
      }
    } else if (step < 4) {
      setStep(s => s + 1);
    }
  };

  const handleAddColumn = async () => {
    if (!colName || !reportId) return;
    try {
      const res = await createColumn.mutateAsync({
        reportId,
        data: {
          columnName: colName,
          dataType: colType,
          description: '',
          isMandatory: true
        }
      });
      setColumns([...columns, res]);
      setColName('');
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to add column', variant: 'destructive' });
    }
  };

  const handlePublish = async () => {
    if (!reportId) return;
    try {
      await publishReport.mutateAsync({ id: reportId });
      toast({ title: 'Published!', description: 'Report catalogue published to entities.' });
      setLocation('/fra/reports');
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to publish.', variant: 'destructive' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Wizard Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Catalogue Builder</h1>
        <p className="text-muted-foreground mt-2">Define schema, establish rules, and deploy to entities.</p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-between relative mb-12">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted -z-10 rounded-full"></div>
        <div 
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 rounded-full transition-all duration-500"
          style={{ width: `${((step - 1) / 3) * 100}%` }}
        ></div>
        
        {STEPS.map((s) => {
          const isActive = step === s.id;
          const isPast = step > s.id;
          return (
            <div key={s.id} className="flex flex-col items-center gap-2 bg-background px-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                isActive ? 'border-primary bg-primary/20 text-primary' : 
                isPast ? 'border-primary bg-primary text-primary-foreground' : 
                'border-muted bg-card text-muted-foreground'
              }`}>
                {isPast ? <Check className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
              </div>
              <span className={`text-xs font-semibold uppercase tracking-wider ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                {s.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="bg-card border border-border/50 rounded-xl shadow-lg overflow-hidden min-h-[400px]">
        {step === 1 && (
          <div className="p-8 space-y-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <FileCode2 className="w-5 h-5 text-primary" /> Core Metadata
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2 col-span-2">
                <Label>Report Name</Label>
                <Input 
                  placeholder="e.g. Q3 Liquidity Coverage Ratio" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="text-lg py-6"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Description / Legal Basis</Label>
                <Textarea 
                  placeholder="Provide context or link to regulatory article..." 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Reporting Frequency</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ad-hoc">Ad-hoc</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target Domain</Label>
                <Select value={domains[0]} onValueChange={v => setDomains([v])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brokerage">Brokerage</SelectItem>
                    <SelectItem value="asset_management">Asset Management</SelectItem>
                    <SelectItem value="financing">Financing</SelectItem>
                    <SelectItem value="leasing">Leasing</SelectItem>
                    <SelectItem value="factoring">Factoring</SelectItem>
                    <SelectItem value="fintech_bnpl">Fintech & BNPL</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="p-0 flex flex-col h-full">
            <div className="p-8 border-b border-border bg-muted/20">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <LayoutGrid className="w-5 h-5 text-primary" /> Define Schema
              </h2>
              <p className="text-muted-foreground text-sm mt-1">Add columns that entities must provide in their submission.</p>
            </div>
            
            <div className="flex-1 p-8 space-y-6">
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-2">
                  <Label>Column Name (exact match required in upload)</Label>
                  <Input placeholder="e.g. TotalAssets" value={colName} onChange={e => setColName(e.target.value)} />
                </div>
                <div className="w-48 space-y-2">
                  <Label>Data Type</Label>
                  <Select value={colType} onValueChange={setColType}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="string">String (Text)</SelectItem>
                      <SelectItem value="integer">Integer</SelectItem>
                      <SelectItem value="decimal">Decimal</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="boolean">Boolean</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddColumn} disabled={!colName}>Add Column</Button>
              </div>

              {columns.length > 0 && (
                <div className="border border-border rounded-md overflow-hidden mt-6">
                  <table className="w-full text-sm">
                    <thead className="bg-muted text-muted-foreground text-left">
                      <tr>
                        <th className="px-4 py-3">Column Key</th>
                        <th className="px-4 py-3">Data Type</th>
                        <th className="px-4 py-3 w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border bg-card">
                      {columns.map(c => (
                        <tr key={c.id} className="hover:bg-muted/50">
                          <td className="px-4 py-3 font-mono text-primary">{c.columnName}</td>
                          <td className="px-4 py-3 uppercase text-xs tracking-wider">{c.dataType}</td>
                          <td className="px-4 py-3 text-right">
                            {/* Actions */}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="p-8">
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-6">
              <PlayCircle className="w-5 h-5 text-primary" /> Rule Engine
            </h2>
            <div className="border border-dashed border-border rounded-xl p-12 text-center text-muted-foreground">
              <PlayCircle className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-foreground mb-2">Automated Validation Rules</h3>
              <p className="max-w-md mx-auto mb-6">Define cross-column constraints and boundaries. E.g. "TotalAssets must be greater than TotalLiabilities".</p>
              <Button variant="outline">Configure New Rule</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="p-8">
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-6 text-emerald-500">
              <ShieldCheck className="w-5 h-5" /> Review & Publish
            </h2>
            <div className="bg-muted/30 border border-border rounded-lg p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">Report Name</div>
                  <div className="font-semibold text-lg">{name}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Target Scope</div>
                  <div className="font-semibold">{domains.join(', ')}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Schema Size</div>
                  <div className="font-semibold">{columns.length} columns defined</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Validation Rules</div>
                  <div className="font-semibold">{rules.length} active rules</div>
                </div>
              </div>
              
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded text-emerald-600 text-sm">
                <strong>Important:</strong> Publishing this catalogue will instantly notify all entities in the target domain. They will be required to acknowledge and comply within the implementation window.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex justify-between items-center pt-4 border-t border-border">
        <Button 
          variant="ghost" 
          onClick={() => setStep(s => Math.max(1, s - 1))}
          disabled={step === 1}
        >
          Back
        </Button>
        
        {step < 4 ? (
          <Button onClick={handleNext} className="gap-2">
            Next Step <ChevronRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={handlePublish} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
            <ShieldCheck className="w-4 h-4" /> Sign & Publish
          </Button>
        )}
      </div>
    </div>
  );
}
