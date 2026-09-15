import React, { useState } from 'react';
import type { RaidRole, DiscordConfig, RaidRequestData } from '../types/raid';
import {
  Users,
  UserPlus,
  Trash2,
  Bell,
  Send,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Radio,
} from 'lucide-react';

interface RosterManagerProps {
  roles: RaidRole[];
  raidData: RaidRequestData;
  config: DiscordConfig;
  onUpdateRoles: (newRoles: RaidRole[]) => void;
  onDispatchAlert: (alertText: string, alertType: 'warning' | 'full' | 'need1' | 'cancel') => Promise<void>;
  isSendingAlert: boolean;
}

export const RosterManager: React.FC<RosterManagerProps> = ({
  roles,
  raidData,
  config,
  onUpdateRoles,
  onDispatchAlert,
  isSendingAlert,
}) => {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [targetRoleId, setTargetRoleId] = useState(roles[0]?.id || '');
  const [broadcastMessage, setBroadcastMessage] = useState<string | null>(null);

  const totalNeeded = roles.reduce((acc, r) => acc + r.needed, 0);
  const totalSigned = roles.reduce((acc, r) => acc + r.players.length, 0);

  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    const roleToUpdate = targetRoleId || roles[0]?.id;
    const updated = roles.map((role) => {
      if (role.id === roleToUpdate) {
        return {
          ...role,
          players: [...role.players, newPlayerName.trim()],
        };
      }
      return role;
    });

    onUpdateRoles(updated);
    setNewPlayerName('');
  };

  const handleRemovePlayer = (roleId: string, playerIndex: number) => {
    const updated = roles.map((role) => {
      if (role.id === roleId) {
        const nextPlayers = [...role.players];
        nextPlayers.splice(playerIndex, 1);
        return { ...role, players: nextPlayers };
      }
      return role;
    });
    onUpdateRoles(updated);
  };

  const handleQuickBroadcast = async (
    type: 'warning' | 'full' | 'need1' | 'cancel'
  ) => {
    let msg = '';
    const leader = raidData.leaderName || 'Commander';
    const voice = raidData.voiceChannel || 'Discord Voice';

    if (type === 'warning') {
      msg = `⏰ **15-MINUTE RAID WARNING!**\n**${raidData.game}: ${raidData.title}** starts in 15 minutes! Please assemble in **${voice}**. Roster: ${totalSigned}/${totalNeeded} joined.`;
    } else if (type === 'full') {
      msg = `🚀 **ROSTER FILLED & LOCKED!**\nAll **${totalNeeded}/${totalNeeded}** spots for **${raidData.title}** are filled! Launching shortly under Leader **${leader}**.`;
    } else if (type === 'need1') {
      msg = `🚨 **URGENT: 1 MORE PLAYER NEEDED!**\nWe need **1 more player** to launch **${raidData.title}** immediately! Ping leader **${leader}** or join voice **${voice}**!`;
    } else if (type === 'cancel') {
      msg = `🛑 **RAID CANCELLED / POSTPONED**\nThe **${raidData.title}** raid session has been called off by **${leader}**. Stay tuned for rescheduled time.`;
    }

    await onDispatchAlert(msg, type);
    setBroadcastMessage(`Broadcast sent to Discord: ${type}`);
    setTimeout(() => setBroadcastMessage(null), 4000);
  };

  return (
    <div
      id="roster-manager-panel"
      className="bg-[#2b2d31] rounded-xl border border-[#383a40] p-4 text-[#dbdee1] space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#35373c] pb-3">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#5865f2]" />
          <h3 className="text-sm font-bold text-white">
            Active Roster Sign-Ups
          </h3>
        </div>
        <div className="flex items-center gap-1.5 text-xs font-semibold">
          <span
            className={`px-2 py-0.5 rounded ${
              totalSigned >= totalNeeded
                ? 'bg-[#23a55a]/20 text-[#57f287]'
                : 'bg-[#5865f2]/20 text-[#c9cdfb]'
            }`}
          >
            {totalSigned} / {totalNeeded} Players
          </span>
        </div>
      </div>

      {/* Role list and players */}
      <div className="space-y-2.5">
        {roles.map((role) => (
          <div
            key={role.id}
            className="bg-[#1e1f22] p-2.5 rounded-lg border border-[#313338]"
          >
            <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
              <span className="flex items-center gap-1.5 text-white">
                <span>{role.emoji}</span>
                <span>{role.name}</span>
              </span>
              <span className="text-[11px] text-[#949ba4] font-mono">
                {role.players.length} of {role.needed} filled
              </span>
            </div>

            {role.players.length === 0 ? (
              <p className="text-[11px] text-[#80848e] italic pl-2">
                No sign-ups yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {role.players.map((player, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 bg-[#2b2d31] border border-[#3f4147] text-white text-xs px-2 py-0.5 rounded-md group"
                  >
                    <span>{player}</span>
                    <button
                      type="button"
                      onClick={() => handleRemovePlayer(role.id, idx)}
                      className="text-[#949ba4] hover:text-[#ed4245] transition-colors cursor-pointer"
                      title="Remove player"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Player Input Form */}
      <form onSubmit={handleAddPlayer} className="pt-1 flex gap-2">
        <select
          value={targetRoleId}
          onChange={(e) => setTargetRoleId(e.target.value)}
          className="bg-[#1e1f22] border border-[#383a40] text-xs text-white px-2 py-1.5 rounded-lg focus:outline-none focus:border-[#5865f2]"
        >
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.emoji} {r.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={newPlayerName}
          onChange={(e) => setNewPlayerName(e.target.value)}
          placeholder="Add player name..."
          className="flex-1 bg-[#1e1f22] border border-[#383a40] text-xs text-white px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-[#5865f2]"
        />

        <button
          type="submit"
          className="px-3 py-1.5 bg-[#5865f2] hover:bg-[#4752c4] text-white text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </form>

      {/* Quick Follow-up Broadcasts Section */}
      <div className="pt-3 border-t border-[#35373c] space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-[#b5bac1]">
          <span className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-[#5865f2] animate-pulse" />
            <span>Send Follow-Up Discord Ping</span>
          </span>
          <span className="text-[10px] text-[#80848e]">1-Click Broadcast</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            id="btn-broadcast-15m"
            disabled={isSendingAlert}
            onClick={() => handleQuickBroadcast('warning')}
            className="p-2 bg-[#1e1f22] hover:bg-[#35373c] border border-[#383a40] text-xs text-[#dbdee1] rounded-lg text-left transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Bell className="w-3.5 h-3.5 text-[#f1c40f] shrink-0" />
            <div className="truncate">
              <span className="font-semibold block text-white text-[11px]">15-Min Warning</span>
              <span className="text-[10px] text-[#949ba4]">Assemble in voice</span>
            </div>
          </button>

          <button
            type="button"
            id="btn-broadcast-full"
            disabled={isSendingAlert}
            onClick={() => handleQuickBroadcast('full')}
            className="p-2 bg-[#1e1f22] hover:bg-[#35373c] border border-[#383a40] text-xs text-[#dbdee1] rounded-lg text-left transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#23a55a] shrink-0" />
            <div className="truncate">
              <span className="font-semibold block text-white text-[11px]">Roster Full</span>
              <span className="text-[10px] text-[#949ba4]">Launching soon</span>
            </div>
          </button>

          <button
            type="button"
            id="btn-broadcast-need1"
            disabled={isSendingAlert}
            onClick={() => handleQuickBroadcast('need1')}
            className="p-2 bg-[#1e1f22] hover:bg-[#35373c] border border-[#383a40] text-xs text-[#dbdee1] rounded-lg text-left transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-[#e67e22] shrink-0" />
            <div className="truncate">
              <span className="font-semibold block text-white text-[11px]">Need 1 More</span>
              <span className="text-[10px] text-[#949ba4]">Urgent spot open</span>
            </div>
          </button>

          <button
            type="button"
            id="btn-broadcast-cancel"
            disabled={isSendingAlert}
            onClick={() => handleQuickBroadcast('cancel')}
            className="p-2 bg-[#1e1f22] hover:bg-[#35373c] border border-[#383a40] text-xs text-[#dbdee1] rounded-lg text-left transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5 text-[#ed4245] shrink-0" />
            <div className="truncate">
              <span className="font-semibold block text-white text-[11px]">Cancel / Postpone</span>
              <span className="text-[10px] text-[#949ba4]">Alert raid is off</span>
            </div>
          </button>
        </div>

        {broadcastMessage && (
          <div className="text-[11px] text-[#57f287] bg-[#23a55a]/10 p-2 rounded border border-[#23a55a]/30 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            <span>{broadcastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};
