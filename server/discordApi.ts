import type { Request, Response } from 'express';

interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

interface DiscordEmbed {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  fields?: DiscordEmbedField[];
  author?: {
    name: string;
    icon_url?: string;
    url?: string;
  };
  thumbnail?: {
    url: string;
  };
  image?: {
    url: string;
  };
  footer?: {
    text: string;
    icon_url?: string;
  };
  timestamp?: string;
}

interface DiscordMessagePayload {
  content?: string;
  username?: string;
  avatar_url?: string;
  embeds?: DiscordEmbed[];
}

export async function handleDiscordTest(req: Request, res: Response) {
  try {
    const { mode, webhookUrl, botToken, channelId } = req.body;

    const finalWebhookUrl = webhookUrl || process.env.DISCORD_WEBHOOK_URL;
    const finalBotToken = botToken || process.env.DISCORD_BOT_TOKEN;
    const finalChannelId = channelId || process.env.DISCORD_CHANNEL_ID;

    if (mode === 'webhook') {
      if (!finalWebhookUrl) {
        return res.status(400).json({
          success: false,
          error: 'No Discord Webhook URL provided.',
        });
      }

      // Test webhook by doing a GET request on the webhook URL
      const response = await fetch(finalWebhookUrl);
      if (!response.ok) {
        const text = await response.text();
        return res.status(response.status).json({
          success: false,
          error: `Discord Webhook returned error (${response.status}): ${text}`,
        });
      }

      const data = await response.json();
      return res.json({
        success: true,
        type: 'webhook',
        name: data.name || 'Discord Webhook',
        channelId: data.channel_id,
        guildId: data.guild_id,
        message: 'Successfully connected to Discord Webhook!',
      });
    } else if (mode === 'bot') {
      if (!finalBotToken) {
        return res.status(400).json({
          success: false,
          error: 'No Discord Bot Token provided.',
        });
      }

      // Verify bot token
      const botResponse = await fetch('https://discord.com/api/v10/users/@me', {
        headers: {
          Authorization: `Bot ${finalBotToken.trim()}`,
        },
      });

      if (!botResponse.ok) {
        return res.status(botResponse.status).json({
          success: false,
          error: `Invalid Discord Bot Token (${botResponse.status}). Make sure the token is correct and bot exists.`,
        });
      }

      const botData = await botResponse.json();

      let channelData = null;
      if (finalChannelId) {
        const channelResponse = await fetch(
          `https://discord.com/api/v10/channels/${finalChannelId.trim()}`,
          {
            headers: {
              Authorization: `Bot ${finalBotToken.trim()}`,
            },
          }
        );

        if (channelResponse.ok) {
          channelData = await channelResponse.json();
        } else {
          return res.status(channelResponse.status).json({
            success: false,
            error: `Bot token is valid (${botData.username}), but could not access Channel ID ${finalChannelId} (${channelResponse.status}). Check if the bot has been invited to the server and has "View Channel" and "Send Messages" permissions.`,
          });
        }
      }

      return res.json({
        success: true,
        type: 'bot',
        botName: botData.username,
        botId: botData.id,
        avatar: botData.avatar
          ? `https://cdn.discordapp.com/avatars/${botData.id}/${botData.avatar}.png`
          : null,
        channel: channelData
          ? {
              id: channelData.id,
              name: channelData.name,
              type: channelData.type,
              guildId: channelData.guild_id,
            }
          : null,
        message: channelData
          ? `Connected as ${botData.username} to #${channelData.name}!`
          : `Connected as ${botData.username}! (Channel ID required to send)`,
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid connection mode. Must be "webhook" or "bot".',
      });
    }
  } catch (err: unknown) {
    const error = err as Error;
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error testing Discord connection.',
    });
  }
}

export async function handleDiscordSend(req: Request, res: Response) {
  try {
    const { mode, webhookUrl, botToken, channelId, payload } = req.body;

    const finalWebhookUrl = webhookUrl || process.env.DISCORD_WEBHOOK_URL;
    const finalBotToken = botToken || process.env.DISCORD_BOT_TOKEN;
    const finalChannelId = channelId || process.env.DISCORD_CHANNEL_ID;

    if (!payload) {
      return res.status(400).json({
        success: false,
        error: 'Missing message payload.',
      });
    }

    if (mode === 'webhook') {
      if (!finalWebhookUrl) {
        return res.status(400).json({
          success: false,
          error: 'No Discord Webhook URL provided.',
        });
      }

      // Add ?wait=true to get the sent message back
      const urlWithWait = finalWebhookUrl.includes('?')
        ? `${finalWebhookUrl}&wait=true`
        : `${finalWebhookUrl}?wait=true`;

      const response = await fetch(urlWithWait, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const text = await response.text();
        return res.status(response.status).json({
          success: false,
          error: `Discord Webhook delivery failed (${response.status}): ${text}`,
        });
      }

      const sentMessage = await response.json().catch(() => ({}));
      return res.json({
        success: true,
        messageId: sentMessage.id || 'sent',
        channelId: sentMessage.channel_id,
        timestamp: new Date().toISOString(),
        deliveryMethod: 'webhook',
      });
    } else if (mode === 'bot') {
      if (!finalBotToken || !finalChannelId) {
        return res.status(400).json({
          success: false,
          error: 'Both Discord Bot Token and Channel ID are required for bot mode.',
        });
      }

      const discordPayload: DiscordMessagePayload = {
        content: payload.content,
        embeds: payload.embeds,
      };

      const response = await fetch(
        `https://discord.com/api/v10/channels/${finalChannelId.trim()}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bot ${finalBotToken.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(discordPayload),
        }
      );

      if (!response.ok) {
        const text = await response.text();
        let parsedError = text;
        try {
          const jsonErr = JSON.parse(text);
          parsedError = jsonErr.message || text;
        } catch {
          // ignore
        }
        return res.status(response.status).json({
          success: false,
          error: `Discord Bot API failed (${response.status}): ${parsedError}. Check bot channel permissions (Send Messages, Embed Links).`,
        });
      }

      const sentMessage = await response.json();
      return res.json({
        success: true,
        messageId: sentMessage.id,
        channelId: sentMessage.channel_id,
        timestamp: sentMessage.timestamp || new Date().toISOString(),
        deliveryMethod: 'bot',
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid mode. Must be "webhook" or "bot".',
      });
    }
  } catch (err: unknown) {
    const error = err as Error;
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error sending to Discord.',
    });
  }
}

export function handleEnvConfig(_req: Request, res: Response) {
  res.json({
    hasBotToken: Boolean(process.env.DISCORD_BOT_TOKEN),
    hasChannelId: Boolean(process.env.DISCORD_CHANNEL_ID),
    hasWebhookUrl: Boolean(process.env.DISCORD_WEBHOOK_URL),
    defaultChannelId: process.env.DISCORD_CHANNEL_ID || '',
  });
}
