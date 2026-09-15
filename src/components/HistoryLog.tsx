import React from 'react';
import type { DispatchedRaidLog } from '../types/raid';
import { History, CheckCircle, AlertCircle, RefreshCw, Send, Copy } from 'lucide-react';

interface HistoryLogProps {
  logs: DispatchedRaidLog[];
  onResend: (log: DispatchedRaidLog) => void;
  onClear: () => void;
}

export const HistoryLog: React.FC<HistoryLogProps> = ({
  logs,
  onResend,
  onClear,
}) => {
  if (logs.length === 0) {
    return (
      <div
        id="history-empty"
        className="bg-[#2b2d31] rounded-xl border border-[#383a40] p-6 text-center text-[#949ba4] text-xs"
      >
        <History className="w-6 h-6 mx-auto mb-2 text-[#4e5058]" />
        <p className="font-semibold text-white">No Raid Dispatches Yet</p>
        <p className="mt-0.5">
          Configure your raid parameters and click "Dispatch Raid Request to Discord" to send your first alert!
        </p>
      </div>
    );
  }

  return (
    <div
      id="history-log-panel"
      className="bg-[#2b2d31] rounded-xl border border-[#383a40] p-4 text-[#dbdee1] space-y-3"
    >
      <div className="flex items-center justify-between border-b border-[#35373c] pb-2.5">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-[#5865f2]" />
          <h3 className="text-sm font-bold text-white">Dispatch History Log</h3>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-xs text-[#949ba4] hover:text-[#ed4245] transition-colors cursor-pointer"
        >
          Clear History
        </button>
      </div>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {logs.map((log) => (
          <div
            key={log.id}
            className="bg-[#1e1f22] p-3 rounded-lg border border-[#35373c] flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-start gap-2.5 min-w-0">
              {log.status === 'delivered' ? (
                <CheckCircle className="w-4 h-4 text-[#23a55a] shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-[#ed4245] shrink-0 mt-0.5" />
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-white truncate">{log.raidTitle}</span>
                  <span className="text-[10px] bg-[#2b2d31] text-[#949ba4] px-1.5 py-0.2 rounded font-mono">
                    {log.game}
                  </span>
                  <span className="text-[10px] bg-[#5865f2]/20 text-[#c9cdfb] px-1.5 py-0.2 rounded uppercase">
                    {log.deliveryMethod}
                  </span>
                </div>
                <div className="text-[11px] text-[#949ba4] mt-0.5 flex items-center gap-2">
                  <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                  {log.messageId && (
                    <span className="font-mono text-[10px] opacity-75">ID: {log.messageId.slice(0, 10)}...</span>
                  )}
                </div>
                {log.error && (
                  <p className="text-[11px] text-[#ed4245] mt-1 font-mono">
                    {log.error}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onResend(log)}
                className="px-2.5 py-1 bg-[#35373c] hover:bg-[#4e5058] text-white text-[11px] font-medium rounded flex items-center gap-1 transition-colors cursor-pointer"
                title="Resend to Discord"
              >
                <RefreshCw className="w-3 h-3" />
                <span className="hidden sm:inline">Resend</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
