import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';
import dotenv from 'dotenv';

dotenv.config();

function discordApiPlugin(): Plugin {
  return {
    name: 'discord-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/discord')) {
          return next();
        }

        const url = new URL(req.url, `http://${req.headers.host}`);
        const pathname = url.pathname;

        res.setHeader('Content-Type', 'application/json');

        if (pathname === '/api/discord/env-config' && req.method === 'GET') {
          res.end(
            JSON.stringify({
              hasBotToken: Boolean(process.env.DISCORD_BOT_TOKEN),
              hasChannelId: Boolean(process.env.DISCORD_CHANNEL_ID),
              hasWebhookUrl: Boolean(process.env.DISCORD_WEBHOOK_URL),
              defaultChannelId: process.env.DISCORD_CHANNEL_ID || '',
            })
          );
          return;
        }

        if (req.method === 'POST') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });

          req.on('end', async () => {
            try {
              const parsedBody = body ? JSON.parse(body) : {};

              if (pathname === '/api/discord/test') {
                const { mode, webhookUrl, botToken, channelId } = parsedBody;
                const finalWebhookUrl = webhookUrl || process.env.DISCORD_WEBHOOK_URL;
                const finalBotToken = botToken || process.env.DISCORD_BOT_TOKEN;
                const finalChannelId = channelId || process.env.DISCORD_CHANNEL_ID;

                if (mode === 'webhook') {
                  if (!finalWebhookUrl) {
                    res.statusCode = 400;
                    return res.end(JSON.stringify({ success: false, error: 'No Discord Webhook URL provided.' }));
                  }
                  const testRes = await fetch(finalWebhookUrl);
                  if (!testRes.ok) {
                    const txt = await testRes.text();
                    res.statusCode = testRes.status;
                    return res.end(JSON.stringify({ success: false, error: `Discord Webhook error (${testRes.status}): ${txt}` }));
                  }
                  const hookData = await testRes.json();
                  return res.end(JSON.stringify({
                    success: true,
                    type: 'webhook',
                    name: hookData.name || 'Discord Webhook',
                    channelId: hookData.channel_id,
                    guildId: hookData.guild_id,
                    message: 'Successfully verified Discord Webhook!',
                  }));
                } else if (mode === 'bot') {
                  if (!finalBotToken) {
                    res.statusCode = 400;
                    return res.end(JSON.stringify({ success: false, error: 'No Discord Bot Token provided.' }));
                  }
                  const botRes = await fetch('https://discord.com/api/v10/users/@me', {
                    headers: { Authorization: `Bot ${finalBotToken.trim()}` },
                  });
                  if (!botRes.ok) {
                    res.statusCode = botRes.status;
                    return res.end(JSON.stringify({ success: false, error: `Invalid Discord Bot Token (${botRes.status}).` }));
                  }
                  const botData = await botRes.json();
                  let channelData = null;
                  if (finalChannelId) {
                    const chanRes = await fetch(`https://discord.com/api/v10/channels/${finalChannelId.trim()}`, {
                      headers: { Authorization: `Bot ${finalBotToken.trim()}` },
                    });
                    if (chanRes.ok) {
                      channelData = await chanRes.json();
                    } else {
                      res.statusCode = chanRes.status;
                      return res.end(JSON.stringify({
                        success: false,
                        error: `Bot connected as ${botData.username}, but failed to find Channel ${finalChannelId} (${chanRes.status}). Check bot channel permissions.`,
                      }));
                    }
                  }
                  return res.end(JSON.stringify({
                    success: true,
                    type: 'bot',
                    botName: botData.username,
                    botId: botData.id,
                    avatar: botData.avatar ? `https://cdn.discordapp.com/avatars/${botData.id}/${botData.avatar}.png` : null,
                    channel: channelData ? { id: channelData.id, name: channelData.name } : null,
                    message: channelData ? `Connected as ${botData.username} to #${channelData.name}!` : `Connected as ${botData.username}!`,
                  }));
                }
              } else if (pathname === '/api/discord/send') {
                const { mode, webhookUrl, botToken, channelId, payload } = parsedBody;
                const finalWebhookUrl = webhookUrl || process.env.DISCORD_WEBHOOK_URL;
                const finalBotToken = botToken || process.env.DISCORD_BOT_TOKEN;
                const finalChannelId = channelId || process.env.DISCORD_CHANNEL_ID;

                if (!payload) {
                  res.statusCode = 400;
                  return res.end(JSON.stringify({ success: false, error: 'Missing message payload.' }));
                }

                if (mode === 'webhook') {
                  if (!finalWebhookUrl) {
                    res.statusCode = 400;
                    return res.end(JSON.stringify({ success: false, error: 'No Discord Webhook URL provided.' }));
                  }
                  const targetUrl = finalWebhookUrl.includes('?') ? `${finalWebhookUrl}&wait=true` : `${finalWebhookUrl}?wait=true`;
                  const dRes = await fetch(targetUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                  });
                  if (!dRes.ok) {
                    const txt = await dRes.text();
                    res.statusCode = dRes.status;
                    return res.end(JSON.stringify({ success: false, error: `Discord Webhook error (${dRes.status}): ${txt}` }));
                  }
                  const sentData = await dRes.json().catch(() => ({}));
                  return res.end(JSON.stringify({
                    success: true,
                    messageId: sentData.id || 'sent',
                    channelId: sentData.channel_id,
                    timestamp: new Date().toISOString(),
                    deliveryMethod: 'webhook',
                  }));
                } else if (mode === 'bot') {
                  if (!finalBotToken || !finalChannelId) {
                    res.statusCode = 400;
                    return res.end(JSON.stringify({ success: false, error: 'Both Discord Bot Token and Channel ID are required.' }));
                  }
                  const dRes = await fetch(`https://discord.com/api/v10/channels/${finalChannelId.trim()}/messages`, {
                    method: 'POST',
                    headers: {
                      Authorization: `Bot ${finalBotToken.trim()}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      content: payload.content,
                      embeds: payload.embeds,
                    }),
                  });
                  if (!dRes.ok) {
                    const txt = await dRes.text();
                    let errMsg = txt;
                    try { errMsg = JSON.parse(txt).message || txt; } catch {}
                    res.statusCode = dRes.status;
                    return res.end(JSON.stringify({ success: false, error: `Discord API error (${dRes.status}): ${errMsg}` }));
                  }
                  const sentData = await dRes.json();
                  return res.end(JSON.stringify({
                    success: true,
                    messageId: sentData.id,
                    channelId: sentData.channel_id,
                    timestamp: sentData.timestamp || new Date().toISOString(),
                    deliveryMethod: 'bot',
                  }));
                }
              }

              res.statusCode = 404;
              return res.end(JSON.stringify({ success: false, error: 'Endpoint not found' }));
            } catch (err: unknown) {
              const e = err as Error;
              res.statusCode = 500;
              return res.end(JSON.stringify({ success: false, error: e.message || 'Internal error' }));
            }
          });
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), discordApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
