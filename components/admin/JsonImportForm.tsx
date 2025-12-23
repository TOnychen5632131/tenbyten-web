import React, { useState } from 'react';
import { Upload, AlertCircle, CheckCircle, FileJson } from 'lucide-react';

const JsonImportForm = () => {
    const [jsonInput, setJsonInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [report, setReport] = useState<{ success: number; duplicates: number; errors: number; details: string[] } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleImport = async () => {
        setIsLoading(true);
        setError(null);
        setReport(null);

        try {
            // Basic JSON validation before sending
            let parsedData;
            try {
                parsedData = JSON.parse(jsonInput);
                if (!Array.isArray(parsedData)) {
                    throw new Error('Input must be an array of objects.');
                }
            } catch (e) {
                setError('Invalid JSON format. Please ensure it is a valid JSON array.');
                setIsLoading(false);
                return;
            }

            const response = await fetch('/api/admin/import-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(parsedData), // Send the array directly
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.error || 'Failed to import data.');
            } else {
                setReport(result.report);
                // Optional: clear input on success? Maybe keep it for reference.
            }

        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                    Paste JSON Data Array
                </label>
                <textarea
                    value={jsonInput}
                    onChange={(e) => setJsonInput(e.target.value)}
                    placeholder='[ { "type": "MARKET", "title": "...", ... }, ... ]'
                    className="w-full h-64 bg-black/50 border border-white/10 rounded-lg p-4 text-sm font-mono text-gray-300 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors resize-y"
                />
                <p className="text-xs text-gray-500 mt-2">
                    Start with <code>[</code> and end with <code>]</code>.
                </p>
            </div>

            {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400">
                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                    <p className="text-sm">{error}</p>
                </div>
            )}

            {report && (
                <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                            <div className="text-2xl font-bold text-emerald-400">{report.success}</div>
                            <div className="text-xs text-emerald-500/70 uppercase tracking-wider font-medium">Added</div>
                        </div>
                        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
                            <div className="text-2xl font-bold text-amber-400">{report.duplicates}</div>
                            <div className="text-xs text-amber-500/70 uppercase tracking-wider font-medium">Duplicates</div>
                        </div>
                        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
                            <div className="text-2xl font-bold text-red-400">{report.errors}</div>
                            <div className="text-xs text-red-500/70 uppercase tracking-wider font-medium">Errors</div>
                        </div>
                    </div>

                    {report.details.length > 0 && (
                        <div className="bg-black/30 rounded-xl p-4 border border-white/5 max-h-40 overflow-y-auto">
                            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 sticky top-0 bg-[#111] py-1">Details</h4>
                            <ul className="space-y-1">
                                {report.details.map((msg, idx) => (
                                    <li key={idx} className="text-xs text-gray-400 font-mono flex items-start gap-2">
                                        <span className="opacity-50">•</span>
                                        {msg}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            <button
                onClick={handleImport}
                disabled={isLoading || !jsonInput.trim()}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-bold rounded-xl shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
                {isLoading ? (
                    <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Importing...
                    </>
                ) : (
                    <>
                        <Upload size={20} />
                        Import Data
                    </>
                )}
            </button>
        </div>
    );
};

export default JsonImportForm;
