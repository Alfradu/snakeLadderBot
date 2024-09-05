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

var channel: TextChannel;

client.on("ready", async () => {
  channel = client.channels.cache.get(process.env.CHANNEL!) as TextChannel;
});

client.on("messageCreate", async (message) => {
  if (message.guildId != process.env.GUILD!) return;
  if (message.author.bot) return;
  if (message.channelId != process.env.CHANNEL!) return;
  if (message.attachments.size == 0) return;
  message.react("🐍");

  const collector = message.createReactionCollector({
    filter: (reaction, user) =>
      reaction.emoji.name === "🐍" && !user.bot && user != message.author,
    time: 1000 * 60 * 60,
    max: 2,
  });

  collector.on("end", async (_, reason) => {
    if (reason === "limit") {
      await channel.send(
        `<@${message.author.id}> has completed a challenge! Rolling the dice....`
      );
      await channel.send(
        `You rolled a ${Math.floor(Math.random() * 6) + 1} 🎲`
      );
    } else {
      await channel.send(
        `<@${message.author.id}> has completed a challenge but not enough people reacted to it 😬 Rolling the dice anyways cause no xp waste....`
      );
      await channel.send(
        `You rolled a ${Math.floor(Math.random() * 6) + 1} 🎲`
      );
    }
  });
});

client.login(process.env.TOKEN!);
