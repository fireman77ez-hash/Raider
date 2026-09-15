import type { RaidRequestData } from '../types/raid';

export function calculateStartTimestamp(
  option: RaidRequestData['startTimeOption'],
  customStartTime?: string
): { epochSeconds: number; formattedText: string; discordTag: string } {
  const now = new Date();
  let target = new Date();

  switch (option) {
    case 'now':
      // right now
      break;
    case '15m':
      target = new Date(now.getTime() + 15 * 60 * 1000);
      break;
    case '30m':
      target = new Date(now.getTime() + 30 * 60 * 1000);
      break;
    case '1h':
      target = new Date(now.getTime() + 60 * 60 * 1000);
      break;
    case '2h':
      target = new Date(now.getTime() + 120 * 60 * 1000);
      break;
    case 'custom':
      if (customStartTime) {
        const parsed = new Date(customStartTime);
        if (!isNaN(parsed.getTime())) {
          target = parsed;
        }
      }
      break;
  }

  const epochSeconds = Math.floor(target.getTime() / 1000);
  const discordTag = `<t:${epochSeconds}:F> (<t:${epochSeconds}:R>)`;
  const formattedText = target.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });

  return { epochSeconds, formattedText, discordTag };
}

export function hexToDecimal(hex: string): number {
  const cleanHex = hex.replace('#', '');
  return parseInt(cleanHex, 16) || 5793266; // default Discord blurple
}

export function buildDiscordPayload(data: RaidRequestData) {
  const { discordTag } = calculateStartTimestamp(data.startTimeOption, data.customStartTime);

  let mentionContent = '';
  if (data.mentionType === 'everyone') {
    mentionContent = '@everyone ⚔️ **RAID CALL ACTIVATED!**';
  } else if (data.mentionType === 'here') {
    mentionContent = '@here ⚔️ **RAID CALL ACTIVATED!**';
  } else if (data.mentionType === 'role' && data.customRoleId) {
    mentionContent = `<@&${data.customRoleId}> ⚔️ **RAID CALL ACTIVATED!**`;
  }

  const totalNeeded = data.roles.reduce((acc, r) => acc + r.needed, 0);
  const totalSigned = data.roles.reduce((acc, r) => acc + r.players.length, 0);

  const roleFields = data.roles.map((role) => {
    const playerList =
      role.players.length > 0
        ? role.players.map((p) => `• ${p}`).join('\n')
        : '_None yet_';
    return {
      name: `${role.emoji} ${role.name} (${role.players.length}/${role.needed})`,
      value: playerList,
      inline: true,
    };
  });

  const fields: Array<{ name: string; value: string; inline?: boolean }> = [
    {
      name: '⏰ Scheduled Launch',
      value: data.startTimeOption === 'now' ? '🔥 **STARTING IMMEDIATELY!**' : discordTag,
      inline: false,
    },
    ...roleFields,
  ];

  if (data.voiceChannel) {
    fields.push({
      name: '🎙️ Voice / Location',
      value: data.voiceChannel,
      inline: true,
    });
  }

  if (data.leaderName) {
    fields.push({
      name: '👑 Raid Commander',
      value: data.leaderName,
      inline: true,
    });
  }

  if (data.requirements) {
    fields.push({
      name: '📜 Requirements & Rules',
      value: data.requirements,
      inline: false,
    });
  }

  if (data.notes) {
    fields.push({
      name: '📝 Commander Briefing',
      value: data.notes,
      inline: false,
    });
  }

  const embed: Record<string, any> = {
    title: `⚔️ [${data.game}] ${data.title}`,
    description: `A new raid request has been dispatched by **${data.leaderName || 'Fireteam Leader'}**.\n**Roster Status**: ${totalSigned}/${totalNeeded} Guardians assembled.\n*React or reply to sign up!*`,
    color: hexToDecimal(data.embedColor),
    fields,
    footer: {
      text: `Discord Raid Bot • Status: ${totalSigned >= totalNeeded ? 'ROSTER FULL' : 'SPOTS AVAILABLE'}`,
      icon_url: 'https://cdn.discordapp.com/embed/avatars/0.png',
    },
    timestamp: new Date().toISOString(),
  };

  if (data.thumbnailUrl) {
    embed.thumbnail = { url: data.thumbnailUrl };
  }

  if (data.bannerUrl) {
    embed.image = { url: data.bannerUrl };
  }

  return {
    content: mentionContent ? `${mentionContent}\n${data.notes ? `> ${data.notes}` : ''}` : undefined,
    username: 'Raid Dispatch Bot',
    avatar_url: 'https://cdn.discordapp.com/embed/avatars/1.png',
    embeds: [embed],
  };
}
