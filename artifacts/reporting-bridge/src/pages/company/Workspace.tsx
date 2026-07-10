import React, { useState, useMemo, useCallback } from 'react';
import { useParams, useLocation } from 'wouter';
import { useGetRequest, useValidateRequest, useSubmitRequest, getGetRequestQueryKey, ValidationResult } from '@workspace/api-client-react';
import { UploadCloud, Play, CheckCircle, ShieldAlert, ArrowLeft, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { StatusBadge } from '@/components/ui/status-badge';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';

type DataRow = Record<string, string | number | null>;

export default function Workspace() {
  const params = useParams();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: request, refetch } = useGetRequest(id, { query: { enabled: !!id, queryKey: getGetRequestQueryKey(id) } });
  const validate = useValidateRequest();
  const submit = useSubmitRequest();

  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<DataRow[]>([]);
  const [certify, setCertify] = useState(false);
  const [validationRun, setValidationRun] = useState(false);
  const [lastValidation, setLastValidation] = useState<ValidationResult | null>(null);

  const columns = useMemo(() => request?.columns.map(c => c.columnName) ?? [], [request]);

  const badRowIndices = useMemo(() => {
    if (!lastValidation) return new Set<number>();
    const set = new Set<number>();
    for (const err of lastValidation.errors) set.add(err.row - 1);
    return set;
  }, [lastValidation]);

  const goodRows = useMemo(() => parsedData.filter((_, i) => !badRowIndices.has(i)), [parsedData, badRowIndices]);
  const badRows = useMemo(() => parsedData.filter((_, i) => badRowIndices.has(i)), [parsedData, badRowIndices]);
  const hasErrors = lastValidation ? lastValidation.errorCount > 0 : false;
  const isClean = validationRun && !hasErrors && parsedData.length > 0;

  const parseCSV = useCallback((text: string): DataRow[] => {
    const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
    if (lines.length === 0) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    return lines.slice(1).map(line => {
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim().replace(/^["']|["']$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim().replace(/^["']|["']$/g, ''));
      const row: DataRow = {};
      headers.forEach((h, idx) => {
        const v = values[idx] ?? '';
        const num = Number(v);
        row[h] = v === '' ? null : (!isNaN(num) && v.trim() !== '') ? num : v;
      });
      return row;
    });
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setValidationRun(false);
    setLastValidation(null);
    setParsedData([]);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const data = parseCSV(text);
      setParsedData(data);
      toast({ title: 'File Loaded', description: `${data.length} rows parsed from ${file.name}.` });
    };
    reader.onerror = () => toast({ title: 'Read Error', description: 'Could not read the file.', variant: 'destructive' });
    reader.readAsText(file);
  };

  const handleValidate = async () => {
    if (parsedData.length === 0) {
      toast({ title: 'No data', description: 'Upload a dataset first.', variant: 'destructive' });
      return;
    }
    try {
      const result = await validate.mutateAsync({ id, data: { data: parsedData } });
      setLastValidation(result);
      setValidationRun(true);
      refetch();
      toast({ title: 'Validation Complete', description: `${result.errorCount} errors found across ${parsedData.length} rows.` });
    } catch (e) {
      toast({ title: 'Validation Failed', variant: 'destructive' });
    }
  };

  const handleSubmit = async () => {
    if (!certify) {
      toast({ title: 'Certification Required', description: 'You must certify the accuracy of the data.', variant: 'destructive' });
      return;
    }
    if (!lastValidation || !lastValidation.valid) {
      toast({ title: 'Validation Required', description: 'All records must be compliant before submission.', variant: 'destructive' });
      return;
    }
    try {
      await submit.mutateAsync({ id, data: { certificationAcknowledged: true, data: parsedData } });
      setLocation(`/company/requests/${id}/receipt`);
    } catch (e) {
      toast({ title: 'Submission Failed', variant: 'destructive' });
    }
  };

  if (!request) return null;

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-500 max-w-7xl mx-auto pb-20">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href={`/company/requests/${id}`} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to Request
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Data Workspace</h1>
            <StatusBadge status={request.status} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Upload & Actions */}
        <div className="lg:col-span-1 space-y-6">
          <label className={cn(
            "block border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer",
            fileName ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 bg-card hover:bg-muted/50'
          )}>
            <input type="file" accept=".csv,.xlsx,.xls,.json" className="hidden" onChange={handleFileChange} />
            <div className={cn(
              "w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center",
              fileName ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            )}>
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-lg mb-1">{fileName ? fileName : 'Drop dataset here'}</h3>
            <p className="text-sm text-muted-foreground">
              {fileName ? `${parsedData.length} rows loaded` : 'CSV format. Max 50MB.'}
            </p>
          </label>

          <Button
            className="w-full gap-2 h-12 text-lg"
            size="lg"
            onClick={handleValidate}
            disabled={parsedData.length === 0 || validate.isPending}
          >
            <Play className="w-5 h-5" />
            Run Validation Engine
          </Button>

          {validationRun && (
            <div className={cn(
              "bg-card border p-6 rounded-xl space-y-4",
              hasErrors ? 'border-destructive/30' : 'border-emerald-500/30'
            )}>
              <div className="flex items-center gap-3">
                {hasErrors ? (
                  <>
                    <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{lastValidation?.errorCount} Violations</div>
                      <div className="text-xs text-muted-foreground">{badRows.length} bad rows · {goodRows.length} good rows</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">All Records Clean</div>
                      <div className="text-xs text-muted-foreground">{goodRows.length} rows comply with rules</div>
                    </div>
                  </>
                )}
              </div>

              {!hasErrors && (
                <>
                  <div className="flex items-start gap-3">
                    <Checkbox id="certify" checked={certify} onCheckedChange={(c) => setCertify(!!c)} />
                    <label htmlFor="certify" className="text-sm leading-tight text-muted-foreground cursor-pointer">
                      I hereby certify that the data provided is accurate, complete, and true to the best of my knowledge.
                    </label>
                  </div>
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-12"
                    onClick={handleSubmit}
                    disabled={submit.isPending}
                  >
                    <CheckCircle className="w-5 h-5 mr-2" /> Submit Officially
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-3 space-y-6">
          {!validationRun ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
              <UploadCloud className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>Upload a CSV file and run the validation engine to see good and bad records.</p>
            </div>
          ) : (
            <>
              {/* Bad Records */}
              {badRows.length > 0 && (
                <div className="bg-card border border-destructive/30 rounded-xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-destructive/20 bg-destructive/5 flex justify-between items-center">
                    <h2 className="font-semibold flex items-center gap-2 text-destructive">
                      <ShieldAlert className="w-5 h-5" /> Bad Records ({badRows.length})
                    </h2>
                    <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">{lastValidation?.errorCount} violations</span>
                  </div>
                  <div className="overflow-x-auto max-h-[400px]">
                    <table className="w-full text-sm">
                      <thead className="bg-muted text-muted-foreground sticky top-0 text-left">
                        <tr>
                          <th className="px-4 py-2 font-medium">Row</th>
                          {columns.map(col => <th key={col} className="px-4 py-2 font-medium">{col}</th>)}
                          <th className="px-4 py-2 font-medium">Error</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {badRows.map((row, i) => {
                          const originalIndex = parsedData.indexOf(row);
                          const rowErrors = lastValidation?.errors.filter(e => e.row === originalIndex + 1) ?? [];
                          return (
                            <tr key={i} className="bg-destructive/5">
                              <td className="px-4 py-3 font-mono text-destructive font-medium">{originalIndex + 1}</td>
                              {columns.map(col => (
                                <td key={col} className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                  {row[col] ?? 'null'}
                                </td>
                              ))}
                              <td className="px-4 py-3">
                                {rowErrors.map((err, idx) => (
                                  <div key={idx} className="text-xs text-destructive mb-1">
                                    <strong>{err.column}:</strong> {err.message}
                                  </div>
                                ))}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Good Records */}
              {goodRows.length > 0 && (
                <div className="bg-card border border-emerald-500/30 rounded-xl overflow-hidden shadow-sm">
                  <div className="p-4 border-b border-emerald-500/20 bg-emerald-500/5 flex justify-between items-center">
                    <h2 className="font-semibold flex items-center gap-2 text-emerald-600">
                      <CheckCircle2 className="w-5 h-5" /> Good Records ({goodRows.length})
                    </h2>
                    <span className="text-xs bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full">Fully compliant</span>
                  </div>
                  <div className="overflow-x-auto max-h-[400px]">
                    <table className="w-full text-sm">
                      <thead className="bg-muted text-muted-foreground sticky top-0 text-left">
                        <tr>
                          <th className="px-4 py-2 font-medium">Row</th>
                          {columns.map(col => <th key={col} className="px-4 py-2 font-medium">{col}</th>)}
                          <th className="px-4 py-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {goodRows.slice(0, 100).map((row, i) => {
                          const originalIndex = parsedData.indexOf(row);
                          return (
                            <tr key={i} className="hover:bg-emerald-500/5">
                              <td className="px-4 py-3 font-mono text-emerald-600 font-medium">{originalIndex + 1}</td>
                              {columns.map(col => (
                                <td key={col} className="px-4 py-3 font-mono text-xs text-muted-foreground">
                                  {row[col] ?? 'null'}
                                </td>
                              ))}
                              <td className="px-4 py-3">
                                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                  <CheckCircle2 className="w-3 h-3" /> Compliant
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {goodRows.length > 100 && (
                      <div className="p-3 text-xs text-center text-muted-foreground border-t border-border">
                        Showing first 100 of {goodRows.length} good rows
                      </div>
                    )}
                  </div>
                </div>
              )}

              {badRows.length === 0 && goodRows.length === 0 && (
                <div className="bg-card border border-border rounded-xl p-12 text-center text-muted-foreground">
                  No records to display.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
