import React, { useState } from 'react';
import type { ConnectionMode, DiscordConfig } from '../types/raid';
import {
  Webhook,
  Bot,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  ExternalLink,
  HelpCircle,
  Sparkles,
  KeyRound,
  Hash,
} from 'lucide-react';

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DiscordConfig;
  onSaveConfig: (config: DiscordConfig) => void;
  envStatus?: {
    hasBotToken: boolean;
    hasChannelId: boolean;
    hasWebhookUrl: boolean;
    defaultChannelId?: string;
  };
}

export const ConnectionModal: React.FC<ConnectionModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  envStatus,
}) => {
  const [mode, setMode] = useState<ConnectionMode>(config.mode);
  const [webhookUrl, setWebhookUrl] = useState(config.webhookUrl);
  const [botToken, setBotToken] = useState(config.botToken);
  const [channelId, setChannelId] = useState(config.channelId);
  const [botClientId, setBotClientId] = useState('');

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
    botName?: string;
    channelName?: string;
  } | null>(null);

  const [activeGuide, setActiveGuide] = useState<'webhook' | 'bot'>('webhook');

  if (!isOpen) return null;

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/discord/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          webhookUrl: webhookUrl.trim(),
          botToken: botToken.trim(),
          channelId: channelId.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({
          success: true,
          message: data.message || 'Connection verified successfully!',
          botName: data.botName,
          channelName: data.channel ? data.channel.name : undefined,
        });
      } else {
        setTestResult({
          success: false,
          error: data.error || 'Connection failed.',
        });
      }
    } catch (err: unknown) {
      const e = err as Error;
      setTestResult({
        success: false,
        error: e.message || 'Network error attempting to test connection.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    onSaveConfig({
      mode,
      webhookUrl: webhookUrl.trim(),
      botToken: botToken.trim(),
      channelId: channelId.trim(),
    });
    onClose();
  };

  const botInviteUrl = botClientId.trim()
    ? `https://discord.com/api/oauth2/authorize?client_id=${botClientId.trim()}&permissions=277025785856&scope=bot%20applications.commands`
    : '';

  return (
    <div
      id="discord-connection-modal"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
    >
      <div className="bg-[#2b2d31] text-[#dbdee1] w-full max-w-2xl rounded-2xl border border-[#3f4147] shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="bg-[#1e1f22] px-6 py-4 border-b border-[#35373c] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#5865f2] flex items-center justify-center text-white font-bold">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                Discord Connection Settings
              </h3>
              <p className="text-xs text-[#949ba4]">
                Choose how raid requests are dispatched to your Discord server
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#949ba4] hover:text-white p-1 rounded-lg hover:bg-[#35373c] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Server Env Notice if any */}
          {envStatus && (envStatus.hasBotToken || envStatus.hasWebhookUrl) && (
            <div className="p-3 bg-[#23a55a]/10 border border-[#23a55a]/30 rounded-lg text-xs flex items-center gap-2 text-[#57f287]">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>
                Environment secrets detected on server:
                {envStatus.hasWebhookUrl && ' [DISCORD_WEBHOOK_URL]'}
                {envStatus.hasBotToken && ' [DISCORD_BOT_TOKEN]'}
                {envStatus.hasChannelId && ' [DISCORD_CHANNEL_ID]'}
              </span>
            </div>
          )}

          {/* Mode Switcher */}
          <div>
            <label className="block text-xs font-semibold text-[#b5bac1] uppercase tracking-wider mb-2">
              Dispatch Delivery Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                id="btn-mode-webhook"
                onClick={() => {
                  setMode('webhook');
                  setTestResult(null);
                }}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === 'webhook'
                    ? 'bg-[#5865f2]/15 border-[#5865f2] text-white shadow-xs'
                    : 'bg-[#1e1f22] border-[#383a40] text-[#949ba4] hover:border-[#4e5058]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Webhook className={`w-4 h-4 ${mode === 'webhook' ? 'text-[#5865f2]' : ''}`} />
                    <span className="text-sm font-bold text-white">Discord Webhook</span>
                  </div>
                  <span className="text-[10px] bg-[#23a55a]/20 text-[#57f287] px-1.5 py-0.5 rounded font-medium">
                    Fastest (Zero Setup)
                  </span>
                </div>
                <p className="text-xs text-[#949ba4] leading-relaxed">
                  Post directly to your channel in seconds. No bot hosting or developer portal needed.
                </p>
              </button>

              <button
                type="button"
                id="btn-mode-bot"
                onClick={() => {
                  setMode('bot');
                  setTestResult(null);
                }}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  mode === 'bot'
                    ? 'bg-[#5865f2]/15 border-[#5865f2] text-white shadow-xs'
                    : 'bg-[#1e1f22] border-[#383a40] text-[#949ba4] hover:border-[#4e5058]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <Bot className={`w-4 h-4 ${mode === 'bot' ? 'text-[#5865f2]' : ''}`} />
                    <span className="text-sm font-bold text-white">Discord Bot API</span>
                  </div>
                  <span className="text-[10px] bg-[#5865f2]/20 text-[#c9cdfb] px-1.5 py-0.5 rounded font-medium">
                    Full Integration
                  </span>
                </div>
                <p className="text-xs text-[#949ba4] leading-relaxed">
                  Post as your official verified Bot account using a Discord Bot Token & Channel ID.
                </p>
              </button>
            </div>
          </div>

          {/* Form Fields Based on Mode */}
          {mode === 'webhook' ? (
            <div className="space-y-3 bg-[#1e1f22] p-4 rounded-xl border border-[#35373c]">
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5 flex items-center justify-between">
                  <span>Discord Webhook URL</span>
                  <span className="text-[#949ba4] text-[11px] font-normal">
                    Format: https://discord.com/api/webhooks/...
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="password"
                    id="input-webhook-url"
                    value={webhookUrl}
                    onChange={(e) => {
                      setWebhookUrl(e.target.value);
                      setTestResult(null);
                    }}
                    placeholder="https://discord.com/api/webhooks/123456789/AbCdEfG..."
                    className="w-full bg-[#2b2d31] border border-[#3f4147] text-white text-xs px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#5865f2] font-mono"
                  />
                </div>
              </div>

              {/* Quick instructions */}
              <div className="text-xs text-[#949ba4] bg-[#2b2d31] p-3 rounded-lg border border-[#383a40] space-y-1.5">
                <div className="font-semibold text-white flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-[#5865f2]" />
                  <span>How to create a Discord Webhook in 15 seconds:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-[11px] text-[#b5bac1] pl-1">
                  <li>In your Discord server, right-click your raid channel (e.g. <code className="text-white">#raids</code>) &gt; <strong>Edit Channel</strong>.</li>
                  <li>Click <strong>Integrations</strong> &gt; <strong>Webhooks</strong> &gt; <strong>New Webhook</strong>.</li>
                  <li>Click <strong>Copy Webhook URL</strong> and paste it into the field above!</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="space-y-3 bg-[#1e1f22] p-4 rounded-xl border border-[#35373c]">
              <div>
                <label className="block text-xs font-semibold text-white mb-1.5 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#5865f2]" />
                  <span>Discord Bot Token</span>
                </label>
                <input
                  type="password"
                  id="input-bot-token"
                  value={botToken}
                  onChange={(e) => {
                    setBotToken(e.target.value);
                    setTestResult(null);
                  }}
                  placeholder="MTM0Njg..."
                  className="w-full bg-[#2b2d31] border border-[#3f4147] text-white text-xs px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#5865f2] font-mono"
                />
                <span className="text-[10px] text-[#949ba4] mt-1 block">
                  Found in Discord Developer Portal &gt; Applications &gt; [Your Bot] &gt; Bot &gt; Reset Token
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white mb-1.5 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-[#5865f2]" />
                  <span>Target Channel ID</span>
                </label>
                <input
                  type="text"
                  id="input-channel-id"
                  value={channelId}
                  onChange={(e) => {
                    setChannelId(e.target.value);
                    setTestResult(null);
                  }}
                  placeholder="e.g. 1198765432109876543"
                  className="w-full bg-[#2b2d31] border border-[#3f4147] text-white text-xs px-3 py-2.5 rounded-lg focus:outline-none focus:border-[#5865f2] font-mono"
                />
                <span className="text-[10px] text-[#949ba4] mt-1 block">
                  Enable Discord Developer Mode (User Settings &gt; Advanced), then right-click your channel &gt; Copy Channel ID.
                </span>
              </div>

              {/* Bot Invite Generator */}
              <div className="pt-2 border-t border-[#35373c]">
                <label className="block text-xs font-semibold text-white mb-1">
                  Optional: Bot Application ID (To generate Invite Link)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={botClientId}
                    onChange={(e) => setBotClientId(e.target.value)}
                    placeholder="Enter Application / Client ID"
                    className="flex-1 bg-[#2b2d31] border border-[#3f4147] text-white text-xs px-3 py-1.5 rounded-lg focus:outline-none font-mono"
                  />
                  {botInviteUrl ? (
                    <a
                      href={botInviteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-semibold rounded-lg flex items-center gap-1"
                    >
                      <span>Invite Bot</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {/* Test Connection Results Card */}
          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-[#23a55a]/10 border-[#23a55a]/40 text-[#57f287]'
                  : 'bg-[#ed4245]/10 border-[#ed4245]/40 text-[#ff7b72]'
              }`}
            >
              {testResult.success ? (
                <CheckCircle className="w-4 h-4 shrink-0 text-[#23a55a] mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-[#ed4245] mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-semibold">
                  {testResult.success ? 'Connection Validated!' : 'Connection Error'}
                </p>
                <p className="mt-0.5 text-[11px] opacity-90">
                  {testResult.message || testResult.error}
                </p>
                {testResult.channelName && (
                  <p className="mt-1 text-[11px] text-white font-mono">
                    Target Channel: #{testResult.channelName}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#1e1f22] px-6 py-4 border-t border-[#35373c] flex items-center justify-between">
          <button
            type="button"
            id="btn-test-discord"
            onClick={handleTest}
            disabled={isTesting || (mode === 'webhook' ? !webhookUrl : !botToken)}
            className="px-4 py-2 bg-[#4e5058] hover:bg-[#5865f2] text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>Test Connection</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-transparent hover:bg-[#35373c] text-[#949ba4] hover:text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              id="btn-save-discord-config"
              onClick={handleSave}
              className="px-5 py-2 bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Save Credentials
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
