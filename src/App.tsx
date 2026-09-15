import React, { useState, useEffect } from 'react';
import {
  RAID_PRESETS,
} from './data/presets';
import type {
  RaidRequestData,
  DiscordConfig,
  DispatchedRaidLog,
  RaidRole,
} from './types/raid';
import {
  buildDiscordPayload,
  calculateStartTimestamp,
} from './utils/discordPayload';
import { DiscordPreview } from './components/DiscordPreview';
import { ConnectionModal } from './components/ConnectionModal';
import { RosterManager } from './components/RosterManager';
import { BotCodeModal } from './components/BotCodeModal';
import { HistoryLog } from './components/HistoryLog';
import {
  Swords,
  Send,
  Settings,
  Code,
  Sparkles,
  Clock,
  Volume2,
  Users,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Palette,
  Shield,
  Plus,
  Trash2,
  HelpCircle,
  Terminal,
} from 'lucide-react';

const STORAGE_KEY_CONFIG = 'discord_raid_bot_config_v1';
const STORAGE_KEY_LOGS = 'discord_raid_bot_logs_v1';

export default function App() {
  // Discord Connection Credentials
  const [config, setConfig] = useState<DiscordConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      mode: 'webhook',
      webhookUrl: '',
      botToken: '',
      channelId: '',
    };
  });

  // Server-detected environment variables
  const [envStatus, setEnvStatus] = useState<{
    hasBotToken: boolean;
    hasChannelId: boolean;
    hasWebhookUrl: boolean;
    defaultChannelId?: string;
  }>({
    hasBotToken: false,
    hasChannelId: false,
    hasWebhookUrl: false,
  });

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isBotCodeOpen, setIsBotCodeOpen] = useState(false);

  // Active right-side tab: 'preview' | 'roster' | 'history'
  const [activeTab, setActiveTab] = useState<'preview' | 'roster' | 'history'>('preview');

  // Raid Request State (initialized with first preset: Destiny 2)
  const [selectedPresetId, setSelectedPresetId] = useState<string>(RAID_PRESETS[0].id);
  const [raidData, setRaidData] = useState<RaidRequestData>({
    game: RAID_PRESETS[0].game,
    title: RAID_PRESETS[0].title,
    difficulty: RAID_PRESETS[0].difficulty,
    leaderName: 'CommanderZavala',
    startTimeOption: '15m',
    customStartTime: '',
    voiceChannel: RAID_PRESETS[0].voiceChannel,
    requirements: RAID_PRESETS[0].requirements,
    notes: 'Bring overload weapons & barrier mods. Voice comms mandatory.',
    mentionType: 'here',
    customRoleId: '',
    embedColor: RAID_PRESETS[0].colorHex,
    thumbnailUrl: RAID_PRESETS[0].thumbnailUrl,
    bannerUrl: RAID_PRESETS[0].bannerUrl,
    roles: RAID_PRESETS[0].defaultRoles.map((r, i) => ({
      id: `role_${i}`,
      name: r.name,
      emoji: r.emoji,
      needed: r.needed,
      players: [],
    })),
  });

  // Sending state and history logs
  const [isSending, setIsSending] = useState(false);
  const [isSendingAlert, setIsSendingAlert] = useState(false);
  const [sendSuccessMessage, setSendSuccessMessage] = useState<string | null>(null);
  const [sendErrorMessage, setSendErrorMessage] = useState<string | null>(null);
  const [copiedPayload, setCopiedPayload] = useState(false);

  const [logs, setLogs] = useState<DispatchedRaidLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LOGS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return [];
  });

  // Fetch server env status on mount
  useEffect(() => {
    fetch('/api/discord/env-config')
      .then((res) => res.json())
      .then((data) => {
        setEnvStatus(data);
        // If config is empty but env vars exist, auto-suggest
        if (!config.channelId && data.defaultChannelId) {
          setConfig((prev) => ({ ...prev, channelId: data.defaultChannelId }));
        }
      })
      .catch(() => {
        // ignore
      });
  }, []);

  // Save config changes to localStorage
  const handleSaveConfig = (newConfig: DiscordConfig) => {
    setConfig(newConfig);
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(newConfig));
  };

  // Preset switch handler
  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const preset = RAID_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setRaidData((prev) => ({
      ...prev,
      game: preset.game,
      title: preset.title,
      difficulty: preset.difficulty,
      voiceChannel: preset.voiceChannel,
      requirements: preset.requirements,
      embedColor: preset.colorHex,
      thumbnailUrl: preset.thumbnailUrl,
      bannerUrl: preset.bannerUrl,
      roles: preset.defaultRoles.map((r, i) => ({
        id: `role_${i}`,
        name: r.name,
        emoji: r.emoji,
        needed: r.needed,
        players: [],
      })),
    }));
  };

  // Role management handlers
  const handleAddRole = () => {
    const newRole: RaidRole = {
      id: `role_${Date.now()}`,
      name: 'Custom Role',
      emoji: '⭐',
      needed: 1,
      players: [],
    };
    setRaidData((prev) => ({
      ...prev,
      roles: [...prev.roles, newRole],
    }));
  };

  const handleRemoveRole = (roleId: string) => {
    setRaidData((prev) => ({
      ...prev,
      roles: prev.roles.filter((r) => r.id !== roleId),
    }));
  };

  const handleUpdateRoleField = (
    roleId: string,
    field: 'name' | 'emoji' | 'needed',
    value: any
  ) => {
    setRaidData((prev) => ({
      ...prev,
      roles: prev.roles.map((r) => {
        if (r.id === roleId) {
          return { ...r, [field]: value };
        }
        return r;
      }),
    }));
  };

  const handleJoinRole = (roleId: string, playerName: string) => {
    setRaidData((prev) => ({
      ...prev,
      roles: prev.roles.map((role) => {
        if (role.id === roleId) {
          return {
            ...role,
            players: [...role.players, playerName],
          };
        }
        return role;
      }),
    }));
  };

  // Send Raid Request to Discord
  const handleDispatchRaid = async () => {
    setIsSending(true);
    setSendSuccessMessage(null);
    setSendErrorMessage(null);

    const payload = buildDiscordPayload(raidData);

    try {
      const res = await fetch('/api/discord/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: config.mode,
          webhookUrl: config.webhookUrl.trim(),
          botToken: config.botToken.trim(),
          channelId: config.channelId.trim(),
          payload,
        }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        const newLog: DispatchedRaidLog = {
          id: `log_${Date.now()}`,
          raidTitle: raidData.title,
          game: raidData.game,
          deliveryMethod: config.mode,
          messageId: result.messageId,
          timestamp: new Date().toISOString(),
          channelId: result.channelId,
          payload,
          status: 'delivered',
        };

        const nextLogs = [newLog, ...logs].slice(0, 50);
        setLogs(nextLogs);
        localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(nextLogs));

        setSendSuccessMessage(
          `⚔️ Raid Request successfully dispatched to Discord (${config.mode === 'webhook' ? 'Webhook' : 'Bot API'})!`
        );
      } else {
        const errorText = result.error || 'Failed to dispatch raid request.';
        setSendErrorMessage(errorText);

        const failedLog: DispatchedRaidLog = {
          id: `log_${Date.now()}`,
          raidTitle: raidData.title,
          game: raidData.game,
          deliveryMethod: config.mode,
          messageId: 'failed',
          timestamp: new Date().toISOString(),
          payload,
          status: 'failed',
          error: errorText,
        };
        setLogs((prev) => [failedLog, ...prev]);
      }
    } catch (err: unknown) {
      const e = err as Error;
      setSendErrorMessage(e.message || 'Network error sending to Discord.');
    } finally {
      setIsSending(false);
    }
  };

  // Quick broadcast alert dispatcher (e.g. 15-minute warning)
  const handleDispatchAlert = async (
    alertText: string,
    _alertType: 'warning' | 'full' | 'need1' | 'cancel'
  ) => {
    setIsSendingAlert(true);
    setSendSuccessMessage(null);
    setSendErrorMessage(null);

    const payload = {
      content: alertText,
      username: 'Raid Dispatch Bot',
      avatar_url: 'https://cdn.discordapp.com/embed/avatars/1.png',
    };

    try {
      const res = await fetch('/api/discord/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: config.mode,
          webhookUrl: config.webhookUrl.trim(),
          botToken: config.botToken.trim(),
          channelId: config.channelId.trim(),
          payload,
        }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setSendSuccessMessage(`📢 Broadcast update sent to Discord!`);
      } else {
        setSendErrorMessage(result.error || 'Failed to broadcast update.');
      }
    } catch (err: unknown) {
      const e = err as Error;
      setSendErrorMessage(e.message || 'Error broadcasting to Discord.');
    } finally {
      setIsSendingAlert(false);
    }
  };

  // Copy JSON Payload to clipboard
  const handleCopyPayload = () => {
    const payload = buildDiscordPayload(raidData);
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const hasCredentials =
    (config.mode === 'webhook' && (config.webhookUrl || envStatus.hasWebhookUrl)) ||
    (config.mode === 'bot' && ((config.botToken && config.channelId) || (envStatus.hasBotToken && envStatus.hasChannelId)));

  return (
    <div className="min-h-screen bg-[#1e1f22] text-[#dbdee1] flex flex-col font-sans selection:bg-[#5865f2] selection:text-white">
      {/* Top Navigation Bar */}
      <header className="bg-[#2b2d31] border-b border-[#35373c] px-4 lg:px-8 py-3 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5865f2] to-[#4752c4] flex items-center justify-center text-white shadow-md shadow-[#5865f2]/20">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  Discord Raid Bot
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#5865f2]/20 text-[#c9cdfb] border border-[#5865f2]/30">
                  Dispatcher & LFG
                </span>
              </div>
              <p className="text-xs text-[#949ba4] hidden sm:block">
                Broadcast interactive raid requests, countdowns, and sign-ups to Discord
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            {/* Connection Status Badge */}
            <button
              id="btn-open-settings"
              onClick={() => setIsSettingsOpen(true)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                hasCredentials
                  ? 'bg-[#23a55a]/10 border-[#23a55a]/40 text-[#57f287] hover:bg-[#23a55a]/20'
                  : 'bg-[#f1c40f]/10 border-[#f1c40f]/40 text-[#f1c40f] hover:bg-[#f1c40f]/20'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  hasCredentials ? 'bg-[#23a55a]' : 'bg-[#f1c40f] animate-ping'
                }`}
              />
              <span className="hidden md:inline">
                {hasCredentials
                  ? config.mode === 'webhook'
                    ? 'Webhook Connected'
                    : 'Bot API Connected'
                  : 'Configure Discord'}
              </span>
              <Settings className="w-3.5 h-3.5" />
            </button>

            {/* Standalone Bot Code Exporter */}
            <button
              id="btn-open-bot-code"
              onClick={() => setIsBotCodeOpen(true)}
              className="px-3 py-1.5 bg-[#35373c] hover:bg-[#4e5058] text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              title="View 24/7 Discord Slash Command Bot Script"
            >
              <Terminal className="w-3.5 h-3.5 text-[#5865f2]" />
              <span className="hidden sm:inline">Bot Source (.js/.py)</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Raid Request Studio (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Preset Selector Banner */}
          <div className="bg-[#2b2d31] p-4 rounded-xl border border-[#383a40] space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#5865f2]" />
                <span>Select Game / Raid Preset</span>
              </span>
              <span className="text-[11px] text-[#949ba4]">Instant template autofill</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {RAID_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  id={`preset-${preset.id}`}
                  onClick={() => handleSelectPreset(preset.id)}
                  className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                    selectedPresetId === preset.id
                      ? 'bg-[#5865f2]/20 border-[#5865f2] text-white shadow-xs'
                      : 'bg-[#1e1f22] border-[#383a40] text-[#949ba4] hover:border-[#4e5058] hover:text-white'
                  }`}
                >
                  <div className="text-[10px] text-[#949ba4] font-semibold uppercase tracking-wider truncate">
                    {preset.game}
                  </div>
                  <div className="text-xs font-bold text-white truncate mt-0.5">
                    {preset.title}
                  </div>
                  <div className="text-[10px] text-[#80848e] truncate">
                    {preset.difficulty}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Form: Core Raid Parameters */}
          <div className="bg-[#2b2d31] p-5 rounded-xl border border-[#383a40] space-y-4">
            <h3 className="text-sm font-bold text-white border-b border-[#35373c] pb-2.5 flex items-center justify-between">
              <span>Raid Parameters & Objective</span>
              <span className="text-xs text-[#949ba4] font-normal">Customizable</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#b5bac1] mb-1">
                  Game Name
                </label>
                <input
                  type="text"
                  value={raidData.game}
                  onChange={(e) => setRaidData({ ...raidData, game: e.target.value })}
                  placeholder="e.g. Destiny 2, WoW, FFXIV"
                  className="w-full bg-[#1e1f22] border border-[#383a40] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-[#5865f2]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#b5bac1] mb-1">
                  Raid Name / Activity
                </label>
                <input
                  type="text"
                  value={raidData.title}
                  onChange={(e) => setRaidData({ ...raidData, title: e.target.value })}
                  placeholder="e.g. Salvation's Edge"
                  className="w-full bg-[#1e1f22] border border-[#383a40] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-[#5865f2]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#b5bac1] mb-1">
                  Difficulty / Mode
                </label>
                <input
                  type="text"
                  value={raidData.difficulty}
                  onChange={(e) => setRaidData({ ...raidData, difficulty: e.target.value })}
                  placeholder="e.g. Master, Heroic, Savage"
                  className="w-full bg-[#1e1f22] border border-[#383a40] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-[#5865f2]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#b5bac1] mb-1">
                  Raid Leader / Host
                </label>
                <input
                  type="text"
                  value={raidData.leaderName}
                  onChange={(e) => setRaidData({ ...raidData, leaderName: e.target.value })}
                  placeholder="e.g. Commander Zavala"
                  className="w-full bg-[#1e1f22] border border-[#383a40] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-[#5865f2]"
                />
              </div>
            </div>

            {/* Launch Timing */}
            <div className="pt-1">
              <label className="block text-xs font-semibold text-[#b5bac1] mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#5865f2]" />
                  <span>Departure / Launch Time</span>
                </span>
                <span className="text-[10px] text-[#949ba4]">
                  Emits dynamic Discord countdown &lt;t:epoch:R&gt;
                </span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  { label: 'Right Now', val: 'now' },
                  { label: 'In 15 Mins', val: '15m' },
                  { label: 'In 30 Mins', val: '30m' },
                  { label: 'In 1 Hour', val: '1h' },
                  { label: 'Custom Time', val: 'custom' },
                ].map((t) => (
                  <button
                    key={t.val}
                    type="button"
                    onClick={() =>
                      setRaidData({
                        ...raidData,
                        startTimeOption: t.val as any,
                      })
                    }
                    className={`py-2 px-2 text-center rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      raidData.startTimeOption === t.val
                        ? 'bg-[#5865f2] border-[#5865f2] text-white shadow-xs'
                        : 'bg-[#1e1f22] border-[#383a40] text-[#949ba4] hover:text-white'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {raidData.startTimeOption === 'custom' && (
                <div className="mt-2.5">
                  <input
                    type="datetime-local"
                    value={raidData.customStartTime}
                    onChange={(e) => setRaidData({ ...raidData, customStartTime: e.target.value })}
                    className="bg-[#1e1f22] border border-[#383a40] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-[#5865f2]"
                  />
                </div>
              )}
            </div>

            {/* Meetup / Voice & Requirements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-[#b5bac1] mb-1 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-[#5865f2]" />
                  <span>Voice Channel / Location</span>
                </label>
                <input
                  type="text"
                  value={raidData.voiceChannel}
                  onChange={(e) => setRaidData({ ...raidData, voiceChannel: e.target.value })}
                  placeholder="e.g. 🔊 Discord: Raid Alpha"
                  className="w-full bg-[#1e1f22] border border-[#383a40] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-[#5865f2]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#b5bac1] mb-1">
                  Mention Alert Level
                </label>
                <select
                  value={raidData.mentionType}
                  onChange={(e) => setRaidData({ ...raidData, mentionType: e.target.value as any })}
                  className="w-full bg-[#1e1f22] border border-[#383a40] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-[#5865f2]"
                >
                  <option value="here">@here (Active online members)</option>
                  <option value="everyone">@everyone (Whole server)</option>
                  <option value="role">Specific Role Ping (&lt;@&amp;RoleID&gt;)</option>
                  <option value="none">No Mention (Silent Embed)</option>
                </select>
              </div>

              {raidData.mentionType === 'role' && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-[#b5bac1] mb-1">
                    Discord Role ID (Right click role in Discord &gt; Copy Role ID)
                  </label>
                  <input
                    type="text"
                    value={raidData.customRoleId}
                    onChange={(e) => setRaidData({ ...raidData, customRoleId: e.target.value })}
                    placeholder="e.g. 987654321098765432"
                    className="w-full bg-[#1e1f22] border border-[#383a40] text-white text-xs px-3 py-2 rounded-lg focus:outline-none font-mono"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#b5bac1] mb-1">
                Prerequisites & Rules
              </label>
              <input
                type="text"
                value={raidData.requirements}
                onChange={(e) => setRaidData({ ...raidData, requirements: e.target.value })}
                placeholder="e.g. Light level 2000+, Bring anti-barrier, Mic required"
                className="w-full bg-[#1e1f22] border border-[#383a40] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-[#5865f2]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#b5bac1] mb-1">
                Commander Briefing / Notes
              </label>
              <input
                type="text"
                value={raidData.notes}
                onChange={(e) => setRaidData({ ...raidData, notes: e.target.value })}
                placeholder="e.g. Doing triumphs and red borders tonight!"
                className="w-full bg-[#1e1f22] border border-[#383a40] text-white text-xs px-3 py-2 rounded-lg focus:outline-none focus:border-[#5865f2]"
              />
            </div>
          </div>

          {/* Role Roster Configuration */}
          <div className="bg-[#2b2d31] p-5 rounded-xl border border-[#383a40] space-y-3">
            <div className="flex items-center justify-between border-b border-[#35373c] pb-2.5">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#5865f2]" />
                <h3 className="text-sm font-bold text-white">
                  Fireteam Roles & Slots
                </h3>
              </div>
              <button
                type="button"
                onClick={handleAddRole}
                className="px-2.5 py-1 bg-[#35373c] hover:bg-[#4e5058] text-white text-xs font-semibold rounded flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Role</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {raidData.roles.map((role) => (
                <div
                  key={role.id}
                  className="bg-[#1e1f22] p-2.5 rounded-lg border border-[#35373c] flex items-center gap-2.5"
                >
                  <input
                    type="text"
                    value={role.emoji}
                    onChange={(e) => handleUpdateRoleField(role.id, 'emoji', e.target.value)}
                    className="w-9 text-center bg-[#2b2d31] border border-[#383a40] text-sm py-1 rounded"
                    title="Role Emoji"
                  />
                  <input
                    type="text"
                    value={role.name}
                    onChange={(e) => handleUpdateRoleField(role.id, 'name', e.target.value)}
                    className="flex-1 bg-[#2b2d31] border border-[#383a40] text-xs text-white px-2.5 py-1.5 rounded"
                    placeholder="Role Name"
                  />
                  <div className="flex items-center gap-1.5 text-xs text-[#949ba4]">
                    <span>Needed:</span>
                    <input
                      type="number"
                      min={1}
                      max={40}
                      value={role.needed}
                      onChange={(e) => handleUpdateRoleField(role.id, 'needed', parseInt(e.target.value) || 1)}
                      className="w-12 bg-[#2b2d31] border border-[#383a40] text-xs text-white text-center py-1 rounded font-mono"
                    />
                  </div>
                  {raidData.roles.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveRole(role.id)}
                      className="text-[#949ba4] hover:text-[#ed4245] p-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Embed Visual Styling */}
          <div className="bg-[#2b2d31] p-4 rounded-xl border border-[#383a40] space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-white border-b border-[#35373c] pb-2">
              <span className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-[#5865f2]" />
                <span>Discord Embed Appearance</span>
              </span>
              <span className="text-[#949ba4] font-normal">Accent & Art</span>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-[#b5bac1] font-semibold">Border Color:</span>
              {[
                { label: 'Discord Blurple', hex: '#5865F2' },
                { label: 'Crimson', hex: '#ED4245' },
                { label: 'Emerald', hex: '#57F287' },
                { label: 'Gold', hex: '#FEE75C' },
                { label: 'Amethyst', hex: '#9B59B6' },
                { label: 'Hazard Orange', hex: '#FFA800' },
              ].map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setRaidData({ ...raidData, embedColor: c.hex })}
                  className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                    raidData.embedColor.toLowerCase() === c.hex.toLowerCase()
                      ? 'border-white scale-110 shadow-md'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                />
              ))}
              <input
                type="text"
                value={raidData.embedColor}
                onChange={(e) => setRaidData({ ...raidData, embedColor: e.target.value })}
                className="w-20 bg-[#1e1f22] border border-[#383a40] text-xs text-white text-center py-1 rounded font-mono"
              />
            </div>
          </div>

          {/* Dispatch Action Bar */}
          <div className="bg-[#2b2d31] p-4 rounded-xl border border-[#383a40] space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                id="btn-dispatch-raid"
                disabled={isSending}
                onClick={handleDispatchRaid}
                className="flex-1 min-w-[200px] py-3 px-5 bg-gradient-to-r from-[#5865f2] to-[#4752c4] hover:from-[#4752c4] hover:to-[#3c45a5] text-white font-bold text-sm rounded-xl shadow-lg shadow-[#5865f2]/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Dispatching to Discord...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Dispatch Raid Request to Discord</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCopyPayload}
                className="py-3 px-4 bg-[#1e1f22] hover:bg-[#35373c] border border-[#383a40] text-xs font-semibold text-[#dbdee1] rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Copy Discord JSON Payload"
              >
                {copiedPayload ? <Check className="w-4 h-4 text-[#57f287]" /> : <Copy className="w-4 h-4" />}
                <span>{copiedPayload ? 'Copied!' : 'Copy JSON'}</span>
              </button>
            </div>

            {/* Success / Error notification */}
            {sendSuccessMessage && (
              <div
                id="dispatch-success-banner"
                className="p-3 bg-[#23a55a]/15 border border-[#23a55a]/40 rounded-lg text-xs text-[#57f287] flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{sendSuccessMessage}</span>
              </div>
            )}

            {sendErrorMessage && (
              <div
                id="dispatch-error-banner"
                className="p-3 bg-[#ed4245]/15 border border-[#ed4245]/40 rounded-lg text-xs text-[#ff7b72] flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Dispatch Error</p>
                  <p className="mt-0.5 text-[11px] opacity-90">{sendErrorMessage}</p>
                  {!hasCredentials && (
                    <button
                      type="button"
                      onClick={() => setIsSettingsOpen(true)}
                      className="mt-1.5 underline font-bold text-white block cursor-pointer"
                    >
                      Click here to enter your Discord Webhook URL or Bot Token &gt;
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Live Discord Preview & Management (5 cols) */}
        <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-20">
          {/* Tab Bar */}
          <div className="bg-[#2b2d31] p-1.5 rounded-xl border border-[#383a40] flex items-center gap-1 text-xs">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'preview'
                  ? 'bg-[#5865f2] text-white shadow-xs'
                  : 'text-[#949ba4] hover:text-white hover:bg-[#1e1f22]'
              }`}
            >
              <Swords className="w-3.5 h-3.5" />
              <span>Live Preview</span>
            </button>

            <button
              onClick={() => setActiveTab('roster')}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'roster'
                  ? 'bg-[#5865f2] text-white shadow-xs'
                  : 'text-[#949ba4] hover:text-white hover:bg-[#1e1f22]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Roster ({raidData.roles.reduce((acc, r) => acc + r.players.length, 0)})</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-2 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-[#5865f2] text-white shadow-xs'
                  : 'text-[#949ba4] hover:text-white hover:bg-[#1e1f22]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>History ({logs.length})</span>
            </button>
          </div>

          {/* Active Tab View */}
          {activeTab === 'preview' && (
            <div className="space-y-3">
              <DiscordPreview
                data={raidData}
                onJoinRole={handleJoinRole}
              />
              <div className="text-[11px] text-[#949ba4] bg-[#2b2d31] p-3 rounded-lg border border-[#35373c] flex items-center justify-between">
                <span>💡 Click any role button above to test interactive sign-ups!</span>
                <span className="font-mono text-[10px] text-[#5865f2]">WYSIWYG</span>
              </div>
            </div>
          )}

          {activeTab === 'roster' && (
            <RosterManager
              roles={raidData.roles}
              raidData={raidData}
              config={config}
              onUpdateRoles={(newRoles) => setRaidData({ ...raidData, roles: newRoles })}
              onDispatchAlert={handleDispatchAlert}
              isSendingAlert={isSendingAlert}
            />
          )}

          {activeTab === 'history' && (
            <HistoryLog
              logs={logs}
              onResend={(log) => {
                setRaidData((prev) => ({
                  ...prev,
                  title: log.raidTitle,
                  game: log.game,
                }));
                handleDispatchRaid();
              }}
              onClear={() => {
                setLogs([]);
                localStorage.removeItem(STORAGE_KEY_LOGS);
              }}
            />
          )}
        </div>
      </main>

      {/* Settings Modal */}
      <ConnectionModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onSaveConfig={handleSaveConfig}
        envStatus={envStatus}
      />

      {/* Standalone Bot Code Modal */}
      <BotCodeModal
        isOpen={isBotCodeOpen}
        onClose={() => setIsBotCodeOpen(false)}
        config={config}
      />
    </div>
  );
}
