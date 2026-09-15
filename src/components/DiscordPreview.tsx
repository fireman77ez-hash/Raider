import React, { useState } from 'react';
import {
  calculateStartTimestamp,
} from '../utils/discordPayload';
import type { RaidRequestData } from '../types/raid';
import { Clock, Shield, Heart, Swords, Volume2, UserCheck, CheckCircle, ExternalLink } from 'lucide-react';

interface DiscordPreviewProps {
  data: RaidRequestData;
  onJoinRole?: (roleId: string, playerName: string) => void;
  onLeaveRole?: (roleId: string, playerName: string) => void;
}

export const DiscordPreview: React.FC<DiscordPreviewProps> = ({
  data,
  onJoinRole,
}) => {
  const [quickPlayerName, setQuickPlayerName] = useState('GuardianHero');
  const [showJoinPrompt, setShowJoinPrompt] = useState(false);
  const [selectedRoleToJoin, setSelectedRoleToJoin] = useState<string | null>(null);

  const { formattedText } = calculateStartTimestamp(
    data.startTimeOption,
    data.customStartTime
  );

  const totalNeeded = data.roles.reduce((acc, r) => acc + r.needed, 0);
  const totalSigned = data.roles.reduce((acc, r) => acc + r.players.length, 0);
  const isFilled = totalSigned >= totalNeeded;

  const handleButtonClick = (roleId: string) => {
    setSelectedRoleToJoin(roleId);
    setShowJoinPrompt(true);
  };

  const confirmJoin = () => {
    if (selectedRoleToJoin && quickPlayerName.trim() && onJoinRole) {
      onJoinRole(selectedRoleToJoin, quickPlayerName.trim());
      setShowJoinPrompt(false);
    }
  };

  return (
    <div
      id="discord-preview-container"
      className="bg-[#313338] text-[#dbdee1] rounded-xl border border-[#1e1f22] overflow-hidden shadow-2xl font-sans"
    >
      {/* Discord Header Bar */}
      <div className="bg-[#2b2d31] px-4 py-2.5 border-b border-[#1f2023] flex items-center justify-between text-xs text-[#949ba4]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-white text-sm"># raid-announcements</span>
          <span className="text-[#80848e]">|</span>
          <span className="hidden sm:inline">Official LFG & Raid Dispatch Channel</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] bg-[#1e1f22] px-2 py-0.5 rounded text-[#949ba4]">
          <span className="inline-block w-2 h-2 rounded-full bg-[#23a55a] animate-pulse"></span>
          Live Discord Preview
        </div>
      </div>

      {/* Discord Message Stream */}
      <div className="p-4 sm:p-5 space-y-3">
        {/* User / Bot Message Header */}
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-full bg-[#5865f2] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow">
            ⚔️
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-white hover:underline cursor-pointer text-[15px]">
                Raid Dispatch Bot
              </span>
              <span className="bg-[#5865f2] text-white text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase">
                BOT
              </span>
              <span className="text-xs text-[#949ba4]">
                Today at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Mention text if any */}
            {data.mentionType !== 'none' && (
              <div className="mt-1.5 text-sm text-[#f2f3f5] flex items-center gap-1.5 flex-wrap">
                <span className="bg-[#5865f2]/20 text-[#c9cdfb] font-medium px-1.5 py-0.5 rounded hover:bg-[#5865f2]/30 cursor-pointer">
                  {data.mentionType === 'everyone'
                    ? '@everyone'
                    : data.mentionType === 'here'
                    ? '@here'
                    : `@Role[${data.customRoleId || 'Raiders'}]`}
                </span>
                <span className="font-semibold text-[#f2f3f5]">⚔️ RAID CALL ACTIVATED!</span>
                {data.notes && (
                  <span className="text-[#949ba4] italic text-xs block w-full mt-0.5">
                    "{data.notes}"
                  </span>
                )}
              </div>
            )}

            {/* Discord Rich Embed */}
            <div
              id="discord-rich-embed"
              className="mt-3 bg-[#2b2d31] rounded-r-md rounded-l-none border-l-4 p-4 space-y-3 max-w-xl transition-all shadow-md"
              style={{ borderLeftColor: data.embedColor || '#5865f2' }}
            >
              {/* Embed Author */}
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <span className="w-4 h-4 rounded-full bg-[#404249] flex items-center justify-center text-[10px]">
                  👑
                </span>
                <span>Raid Leader: {data.leaderName || 'Vanguard Commander'}</span>
              </div>

              {/* Embed Title & Status Badge */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-base font-bold text-white leading-tight flex items-center gap-2">
                    <span>⚔️ [{data.game}] {data.title || 'Untitled Raid'}</span>
                  </h4>
                  <p className="text-xs text-[#949ba4] mt-1 font-medium">
                    <span className="inline-block px-2 py-0.5 bg-[#1e1f22] text-[#e0e1e5] rounded text-[11px] mr-2">
                      {data.difficulty}
                    </span>
                    {totalSigned}/{totalNeeded} Assembled
                  </p>
                </div>

                {data.thumbnailUrl && (
                  <img
                    src={data.thumbnailUrl}
                    alt="Raid icon"
                    className="w-14 h-14 rounded object-cover border border-[#3f4147] shrink-0"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                )}
              </div>

              {/* Time & Launch Field */}
              <div className="bg-[#1e1f22] p-2.5 rounded border border-[#383a40] text-xs">
                <div className="flex items-center gap-1.5 text-[#dbdee1] font-semibold">
                  <Clock className="w-3.5 h-3.5 text-[#5865f2]" />
                  <span>Scheduled Departure:</span>
                  <span className="text-[#57f287] font-bold">
                    {data.startTimeOption === 'now' ? '🔥 Right Now (Instant)' : formattedText}
                  </span>
                </div>
                <div className="text-[11px] text-[#949ba4] mt-0.5">
                  Dynamic Discord relative time tag: <code className="text-[#5865f2]">&lt;t:epoch:R&gt;</code>
                </div>
              </div>

              {/* Roster Roles Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {data.roles.map((role) => (
                  <div
                    key={role.id}
                    className="bg-[#232428] p-2.5 rounded border border-[#35373c] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between font-semibold text-white">
                      <span className="flex items-center gap-1.5">
                        <span>{role.emoji}</span>
                        <span>{role.name}</span>
                      </span>
                      <span
                        className={`text-[11px] px-1.5 py-0.2 rounded font-mono ${
                          role.players.length >= role.needed
                            ? 'bg-[#23a55a]/20 text-[#57f287]'
                            : 'bg-[#5865f2]/20 text-[#c9cdfb]'
                        }`}
                      >
                        {role.players.length}/{role.needed}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#949ba4] pl-5">
                      {role.players.length === 0 ? (
                        <span className="italic text-[#80848e]">No one signed up yet</span>
                      ) : (
                        <ul className="space-y-0.5">
                          {role.players.map((player, idx) => (
                            <li key={idx} className="text-[#dbdee1] flex items-center gap-1">
                              <span className="w-1 h-1 rounded-full bg-[#57f287]"></span>
                              <span>{player}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Voice & Requirements */}
              <div className="grid grid-cols-1 gap-1.5 text-xs text-[#b5bac1] pt-1">
                {data.voiceChannel && (
                  <div className="flex items-center gap-2 bg-[#232428]/60 px-2.5 py-1.5 rounded">
                    <Volume2 className="w-3.5 h-3.5 text-[#949ba4] shrink-0" />
                    <span className="text-[#dbdee1] font-medium">{data.voiceChannel}</span>
                  </div>
                )}
                {data.requirements && (
                  <div className="text-[11px] text-[#949ba4] bg-[#232428]/40 px-2.5 py-1.5 rounded border border-[#313338]">
                    <span className="text-[#dbdee1] font-medium">Requirements: </span>
                    {data.requirements}
                  </div>
                )}
              </div>

              {/* Banner Image if provided */}
              {data.bannerUrl && (
                <div className="pt-1">
                  <img
                    src={data.bannerUrl}
                    alt="Raid banner"
                    className="w-full max-h-48 object-cover rounded border border-[#3f4147]"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Embed Footer */}
              <div className="text-[10px] text-[#949ba4] flex items-center justify-between pt-1 border-t border-[#35373c]">
                <span>Discord Raid Bot • Status: {isFilled ? 'ROSTER FULL' : 'OPEN RECRUITMENT'}</span>
                <span>Today at {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            {/* Interactive Discord Buttons (Action Row) */}
            <div className="mt-2.5 flex flex-wrap gap-2 max-w-xl">
              {data.roles.map((role) => (
                <button
                  key={role.id}
                  id={`discord-btn-join-${role.id}`}
                  onClick={() => handleButtonClick(role.id)}
                  className="px-3 py-1.5 bg-[#4e5058] hover:bg-[#6d6f78] active:bg-[#474950] text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                  title={`Click to simulate signing up as ${role.name}`}
                >
                  <span>{role.emoji}</span>
                  <span>Join {role.name}</span>
                  <span className="text-[10px] bg-black/20 px-1 rounded ml-1">
                    {role.players.length}/{role.needed}
                  </span>
                </button>
              ))}
            </div>

            {/* In-app Simulator dialog */}
            {showJoinPrompt && (
              <div className="mt-3 p-3 bg-[#232428] rounded-lg border border-[#5865f2]/40 max-w-xl flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-[11px] text-[#b5bac1] font-semibold mb-1">
                    Simulate Player Sign-up:
                  </label>
                  <input
                    type="text"
                    value={quickPlayerName}
                    onChange={(e) => setQuickPlayerName(e.target.value)}
                    placeholder="Enter player username"
                    className="w-full bg-[#1e1f22] border border-[#3b3e45] text-white text-xs px-2.5 py-1.5 rounded focus:outline-none focus:border-[#5865f2]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') confirmJoin();
                    }}
                  />
                </div>
                <div className="flex items-end gap-1.5 pt-4">
                  <button
                    onClick={confirmJoin}
                    className="px-3 py-1.5 bg-[#23a55a] hover:bg-[#1f934f] text-white text-xs font-bold rounded cursor-pointer"
                  >
                    Add to Roster
                  </button>
                  <button
                    onClick={() => setShowJoinPrompt(false)}
                    className="px-2.5 py-1.5 bg-[#313338] hover:bg-[#3f4147] text-[#949ba4] text-xs rounded cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
