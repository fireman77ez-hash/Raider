export type ConnectionMode = 'webhook' | 'bot';

export interface DiscordConfig {
  mode: ConnectionMode;
  webhookUrl: string;
  botToken: string;
  channelId: string;
}

export interface RaidRole {
  id: string;
  name: string;
  emoji: string;
  needed: number;
  players: string[];
}

export interface RaidPreset {
  id: string;
  game: string;
  category: string;
  title: string;
  difficulty: string;
  defaultRoles: {
    name: string;
    emoji: string;
    needed: number;
  }[];
  voiceChannel: string;
  requirements: string;
  bannerUrl: string;
  thumbnailUrl: string;
  colorHex: string;
}

export interface RaidRequestData {
  game: string;
  title: string;
  difficulty: string;
  leaderName: string;
  startTimeOption: 'now' | '15m' | '30m' | '1h' | '2h' | 'custom';
  customStartTime?: string;
  voiceChannel: string;
  requirements: string;
  notes: string;
  mentionType: 'everyone' | 'here' | 'role' | 'none';
  customRoleId?: string;
  embedColor: string;
  thumbnailUrl: string;
  bannerUrl: string;
  roles: RaidRole[];
}

export interface DispatchedRaidLog {
  id: string;
  raidTitle: string;
  game: string;
  deliveryMethod: ConnectionMode;
  messageId: string;
  timestamp: string;
  channelId?: string;
  payload: any;
  status: 'delivered' | 'failed';
  error?: string;
}
