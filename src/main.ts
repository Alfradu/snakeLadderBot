import dotenv from "dotenv";
import { Client, GatewayIntentBits, Partials } from "discord.js";

dotenv.config();
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [
    Partials.User,
    Partials.Message,
    Partials.Channel,
    Partials.Reaction,
  ],
});

client.on("error", (err) => {
  console.log(err.message);
});

client.on("disconnected", () => {
  console.log("Crashed");
});

client.on("messageCreate", (message) => {
  if (message.guildId != process.env.GUILD!) return;
  if (message.author.bot) return;
  if (message.channelId != process.env.CHANNEL!) return;
  if (message.attachments.size == 0) return;
  message.react("🎉");
});

client.on("messageReactionAdd", async (reaction, user) => {
  if (reaction.message.author == user) return;
  if (user.bot) return;
  if (reaction.count < 3) return;
});

client.on("messageReactionRemove", async (reaction, user) => {
  if (reaction.message.author == user) return;
  return;
});

client.on("ready", () => {
  console.log("ready");
});

client.login(process.env.TOKEN!);
