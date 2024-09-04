import "dotenv/config.js";
import { Client, GatewayIntentBits, Partials, TextChannel } from "discord.js";

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

var completedChallenges: Array<string> = [];
var channel: TextChannel;

client.on("messageCreate", (message) => {
  if (message.guildId != process.env.GUILD!) return;
  if (message.author.bot) return;
  if (message.channelId != process.env.CHANNEL!) return;
  if (message.attachments.size == 0) return;
  message.react("🎉");
});

client.on("messageReactionAdd", async (reaction, user) => {
  if (completedChallenges.includes(reaction.message.id)) return;
  if (reaction.message.author == user) return;
  if (user.bot) return;
  if (reaction.count < 3) return;
  if (!channel)
    channel = client.channels.cache.get(process.env.CHANNEL!) as TextChannel;
  await channel.send(
    `${reaction.message.author.tag} has completed a challenge! Rolling the dice....`
  );
  await channel.send(`You rolled a ${Math.floor(Math.random() * 6) + 1} 🎲`);
  completedChallenges.push(reaction.message.id);
});

client.login(process.env.TOKEN!);
