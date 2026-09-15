import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Download, Code2, Sparkles, BookOpen } from 'lucide-react';
import type { DiscordConfig } from '../types/raid';

interface BotCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: DiscordConfig;
}

export const BotCodeModal: React.FC<BotCodeModalProps> = ({
  isOpen,
  onClose,
  config,
}) => {
  const [activeLang, setActiveLang] = useState<'nodejs' | 'python'>('nodejs');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const botToken = config.botToken || 'YOUR_DISCORD_BOT_TOKEN_HERE';
  const defaultChannelId = config.channelId || 'YOUR_CHANNEL_ID_HERE';

  const nodeCode = `// Discord Raid Request Bot (Discord.js v14)
// Run with: node bot.js
// Dependencies: npm install discord.js dotenv

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  REST,
  Routes,
} = require('discord.js');

const TOKEN = process.env.DISCORD_BOT_TOKEN || '${botToken}';
const DEFAULT_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID || '${defaultChannelId}';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// In-memory raid tracker
const activeRaids = new Map();

// Register Slash Commands
const commands = [
  new SlashCommandBuilder()
    .setName('raid')
    .setDescription('Create a new raid request announcement')
    .addStringOption((opt) =>
      opt.setName('title').setDescription('Raid Name / Activity').setRequired(true)
    )
    .addStringOption((opt) =>
      opt.setName('difficulty').setDescription('Difficulty (Normal, Master, Savage, etc.)').setRequired(false)
    )
    .addIntegerOption((opt) =>
      opt.setName('tanks').setDescription('Number of Tanks needed').setRequired(false)
    )
    .addIntegerOption((opt) =>
      opt.setName('healers').setDescription('Number of Healers needed').setRequired(false)
    )
    .addIntegerOption((opt) =>
      opt.setName('dps').setDescription('Number of DPS needed').setRequired(false)
    )
    .addStringOption((opt) =>
      opt.setName('time').setDescription('Start time (e.g. In 15 minutes, Tonight 8pm)').setRequired(false)
    )
    .addStringOption((opt) =>
      opt.setName('notes').setDescription('Requirements or gear level').setRequired(false)
    ),
];

client.once('ready', async () => {
  console.log(\`✅ Raid Bot logged in as \${client.user.tag}!\`);

  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    console.log('Registering application slash commands...');
    await rest.put(Routes.applicationCommands(client.user.id), {
      body: commands,
    });
    console.log('Successfully registered /raid command globally!');
  } catch (error) {
    console.error('Failed to register commands:', error);
  }
});

// Handle Slash Commands and Button Interactions
client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'raid') {
      const title = interaction.options.getString('title');
      const difficulty = interaction.options.getString('difficulty') || 'Normal';
      const tanksNeeded = interaction.options.getInteger('tanks') || 2;
      const healersNeeded = interaction.options.getInteger('healers') || 2;
      const dpsNeeded = interaction.options.getInteger('dps') || 4;
      const time = interaction.options.getString('time') || 'Starting Soon';
      const notes = interaction.options.getString('notes') || 'All guardians welcome!';

      const raidId = \`raid_\${Date.now()}\`;
      const raidData = {
        id: raidId,
        title,
        difficulty,
        leader: interaction.user.username,
        tanksNeeded,
        healersNeeded,
        dpsNeeded,
        tanks: [],
        healers: [],
        dps: [],
        time,
        notes,
      };

      activeRaids.set(raidId, raidData);

      const embed = buildRaidEmbed(raidData);
      const row = buildRaidButtons(raidId);

      await interaction.reply({
        content: '@here ⚔️ **NEW RAID REQUEST ANNOUNCED!**',
        embeds: [embed],
        components: [row],
      });
    }
  } else if (interaction.isButton()) {
    const [action, role, raidId] = interaction.customId.split(':');
    const raid = activeRaids.get(raidId);

    if (!raid) {
      return interaction.reply({
        content: 'This raid has expired or was removed.',
        ephemeral: true,
      });
    }

    const username = interaction.user.username;

    // Remove user from all roles first
    raid.tanks = raid.tanks.filter((u) => u !== username);
    raid.healers = raid.healers.filter((u) => u !== username);
    raid.dps = raid.dps.filter((u) => u !== username);

    if (action === 'join') {
      if (role === 'tank') {
        if (raid.tanks.length < raid.tanksNeeded) raid.tanks.push(username);
        else return interaction.reply({ content: 'Tank slots are full!', ephemeral: true });
      } else if (role === 'healer') {
        if (raid.healers.length < raid.healersNeeded) raid.healers.push(username);
        else return interaction.reply({ content: 'Healer slots are full!', ephemeral: true });
      } else if (role === 'dps') {
        if (raid.dps.length < raid.dpsNeeded) raid.dps.push(username);
        else return interaction.reply({ content: 'DPS slots are full!', ephemeral: true });
      }
    }

    // Update message
    const updatedEmbed = buildRaidEmbed(raid);
    const row = buildRaidButtons(raidId);

    await interaction.update({
      embeds: [updatedEmbed],
      components: [row],
    });
  }
});

function buildRaidEmbed(raid) {
  const totalSigned = raid.tanks.length + raid.healers.length + raid.dps.length;
  const totalNeeded = raid.tanksNeeded + raid.healersNeeded + raid.dpsNeeded;

  return new EmbedBuilder()
    .setColor(totalSigned >= totalNeeded ? 0x23a55a : 0x5865f2)
    .setTitle(\`⚔️ RAID REQUEST: \${raid.title}\`)
    .setDescription(\`Organized by **\${raid.leader}**\\nDifficulty: **\${raid.difficulty}**\\nStatus: **\${totalSigned}/\${totalNeeded} Joined**\`)
    .addFields(
      { name: '⏰ Departure Time', value: raid.time, inline: false },
      {
        name: \`🛡️ Tanks (\${raid.tanks.length}/\${raid.tanksNeeded})\`,
        value: raid.tanks.length ? raid.tanks.map((u) => \`• \${u}\`).join('\\n') : '_None_',
        inline: true,
      },
      {
        name: \`💚 Healers (\${raid.healers.length}/\${raid.healersNeeded})\`,
        value: raid.healers.length ? raid.healers.map((u) => \`• \${u}\`).join('\\n') : '_None_',
        inline: true,
      },
      {
        name: \`⚔️ DPS (\${raid.dps.length}/\${raid.dpsNeeded})\`,
        value: raid.dps.length ? raid.dps.map((u) => \`• \${u}\`).join('\\n') : '_None_',
        inline: true,
      },
      { name: '📜 Instructions / Notes', value: raid.notes, inline: false }
    )
    .setFooter({ text: 'Click the buttons below to sign up or change roles!' })
    .setTimestamp();
}

function buildRaidButtons(raidId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(\`join:tank:\${raidId}\`)
      .setLabel('🛡️ Tank')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(\`join:healer:\${raidId}\`)
      .setLabel('💚 Healer')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(\`join:dps:\${raidId}\`)
      .setLabel('⚔️ DPS')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(\`leave:none:\${raidId}\`)
      .setLabel('❌ Leave')
      .setStyle(ButtonStyle.Secondary)
  );
}

client.login(TOKEN);
`;

  const pythonCode = `# Discord Raid Request Bot (Discord.py)
# Run with: python bot.py
# Dependencies: pip install discord.py python-dotenv

import os
import discord
from discord import app_commands
from discord.ext import commands

TOKEN = os.getenv("DISCORD_BOT_TOKEN", "${botToken}")

intents = discord.Intents.default()
intents.message_content = True
bot = commands.Bot(command_prefix="!", intents=intents)

class RaidJoinView(discord.ui.View):
    def __init__(self, raid_data):
        super().__init__(timeout=None)
        self.raid = raid_data

    async def update_embed(self, interaction: discord.Interaction):
        total_signed = len(self.raid["tanks"]) + len(self.raid["healers"]) + len(self.raid["dps"])
        total_needed = self.raid["tanks_needed"] + self.raid["healers_needed"] + self.raid["dps_needed"]
        
        embed = discord.Embed(
            title=f"⚔️ RAID REQUEST: {self.raid['title']}",
            description=f"Leader: **{self.raid['leader']}**\\nStatus: **{total_signed}/{total_needed}** Players Assembled",
            color=0x23A55A if total_signed >= total_needed else 0x5865F2
        )
        embed.add_field(name="⏰ Departure Time", value=self.raid["time"], inline=False)
        embed.add_field(
            name=f"🛡️ Tanks ({len(self.raid['tanks'])}/{self.raid['tanks_needed']})",
            value="\\n".join([f"• {p}" for p in self.raid["tanks"]]) or "_None_",
            inline=True
        )
        embed.add_field(
            name=f"💚 Healers ({len(self.raid['healers'])}/{self.raid['healers_needed']})",
            value="\\n".join([f"• {p}" for p in self.raid["healers"]]) or "_None_",
            inline=True
        )
        embed.add_field(
            name=f"⚔️ DPS ({len(self.raid['dps'])}/{self.raid['dps_needed']})",
            value="\\n".join([f"• {p}" for p in self.raid["dps"]]) or "_None_",
            inline=True
        )
        embed.add_field(name="📜 Notes", value=self.raid["notes"], inline=False)
        embed.set_footer(text="Click buttons below to sign up!")
        await interaction.response.edit_message(embed=embed, view=self)

    @discord.ui.button(label="🛡️ Tank", style=discord.ButtonStyle.primary)
    async def join_tank(self, interaction: discord.Interaction, button: discord.ui.Button):
        name = interaction.user.display_name
        self.remove_user(name)
        if len(self.raid["tanks"]) < self.raid["tanks_needed"]:
            self.raid["tanks"].append(name)
            await self.update_embed(interaction)
        else:
            await interaction.response.send_message("Tank slots full!", ephemeral=True)

    @discord.ui.button(label="💚 Healer", style=discord.ButtonStyle.success)
    async def join_healer(self, interaction: discord.Interaction, button: discord.ui.Button):
        name = interaction.user.display_name
        self.remove_user(name)
        if len(self.raid["healers"]) < self.raid["healers_needed"]:
            self.raid["healers"].append(name)
            await self.update_embed(interaction)
        else:
            await interaction.response.send_message("Healer slots full!", ephemeral=True)

    @discord.ui.button(label="⚔️ DPS", style=discord.ButtonStyle.danger)
    async def join_dps(self, interaction: discord.Interaction, button: discord.ui.Button):
        name = interaction.user.display_name
        self.remove_user(name)
        if len(self.raid["dps"]) < self.raid["dps_needed"]:
            self.raid["dps"].append(name)
            await self.update_embed(interaction)
        else:
            await interaction.response.send_message("DPS slots full!", ephemeral=True)

    @discord.ui.button(label="❌ Leave", style=discord.ButtonStyle.secondary)
    async def leave(self, interaction: discord.Interaction, button: discord.ui.Button):
        name = interaction.user.display_name
        self.remove_user(name)
        await self.update_embed(interaction)

    def remove_user(self, name):
        for role_list in [self.raid["tanks"], self.raid["healers"], self.raid["dps"]]:
            if name in role_list:
                role_list.remove(name)

@bot.event
async def on_ready():
    print(f"Logged in as {bot.user.name} ({bot.user.id})")
    try:
        synced = await bot.tree.sync()
        print(f"Synced {len(synced)} slash commands globally!")
    except Exception as e:
        print(f"Command sync error: {e}")

@bot.tree.command(name="raid", description="Create a raid request callout")
@app_commands.describe(title="Raid Activity", tanks="Tanks needed", healers="Healers needed", dps="DPS needed", time="Start time")
async def raid_command(interaction: discord.Interaction, title: str, tanks: int = 2, healers: int = 2, dps: int = 4, time: str = "Starting Soon", notes: str = "Assemble guardians!"):
    raid_data = {
        "title": title,
        "leader": interaction.user.display_name,
        "tanks_needed": tanks,
        "healers_needed": healers,
        "dps_needed": dps,
        "tanks": [],
        "healers": [],
        "dps": [],
        "time": time,
        "notes": notes
    }
    view = RaidJoinView(raid_data)
    embed = discord.Embed(
        title=f"⚔️ RAID REQUEST: {title}",
        description=f"Leader: **{interaction.user.display_name}**\\nStatus: **0/{tanks+healers+dps}** Assembled",
        color=0x5865F2
    )
    embed.add_field(name="⏰ Departure Time", value=time, inline=False)
    embed.add_field(name=f"🛡️ Tanks (0/{tanks})", value="_None_", inline=True)
    embed.add_field(name=f"💚 Healers (0/{healers})", value="_None_", inline=True)
    embed.add_field(name=f"⚔️ DPS (0/{dps})", value="_None_", inline=True)
    embed.add_field(name="📜 Notes", value=notes, inline=False)
    embed.set_footer(text="Click buttons below to sign up!")

    await interaction.response.send_message(
        content="@here ⚔️ **NEW RAID REQUEST ANNOUNCED!**",
        embed=embed,
        view=view
    )

bot.run(TOKEN)
`;

  const currentCode = activeLang === 'nodejs' ? nodeCode : pythonCode;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = activeLang === 'nodejs' ? 'bot.js' : 'bot.py';
    const blob = new Blob([currentCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="bot-code-modal"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-[#2b2d31] text-[#dbdee1] w-full max-w-3xl rounded-2xl border border-[#3f4147] shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="bg-[#1e1f22] px-6 py-4 border-b border-[#35373c] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#5865f2] flex items-center justify-center text-white font-bold">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                Standalone Discord Bot Source Code
              </h3>
              <p className="text-xs text-[#949ba4]">
                Complete 24/7 background bot code with slash commands & interactive buttons
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

        {/* Tab switcher */}
        <div className="bg-[#232428] px-6 py-2.5 border-b border-[#35373c] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveLang('nodejs')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeLang === 'nodejs'
                  ? 'bg-[#5865f2] text-white shadow-xs'
                  : 'text-[#949ba4] hover:text-white hover:bg-[#313338]'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Node.js (Discord.js v14)</span>
            </button>
            <button
              onClick={() => setActiveLang('python')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                activeLang === 'python'
                  ? 'bg-[#5865f2] text-white shadow-xs'
                  : 'text-[#949ba4] hover:text-white hover:bg-[#313338]'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>Python (Discord.py)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-[#313338] hover:bg-[#3f4147] text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#57f287]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 bg-[#313338] hover:bg-[#3f4147] text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        {/* Code View Area */}
        <div className="p-4 bg-[#1e1f22]">
          <pre className="text-xs text-[#dbdee1] font-mono p-4 rounded-xl bg-[#18191c] border border-[#2b2d31] overflow-x-auto max-h-[50vh] leading-relaxed">
            {currentCode}
          </pre>
        </div>

        {/* Quick run instruction footer */}
        <div className="bg-[#232428] px-6 py-3.5 border-t border-[#35373c] text-xs text-[#949ba4] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#5865f2]" />
            <span>
              {activeLang === 'nodejs'
                ? 'Quick start: npm install discord.js dotenv && node bot.js'
                : 'Quick start: pip install discord.py python-dotenv && python bot.py'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#4e5058] hover:bg-[#5865f2] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
