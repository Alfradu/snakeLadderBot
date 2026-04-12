import { Client, GatewayIntentBits, Partials, TextChannel } from "discord.js";

export const state: { client: Client; channel: TextChannel | null } = {
  client: new Client({
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
  }),
  channel: null,
};

export function registerBotHandlers(): void {
  state.client.on("ready", async () => {
    state.channel = state.client.channels.cache.get(
      process.env.CHANNEL!,
    ) as TextChannel;
  });

  // state.client.on("messageCreate", async (message) => {
  //   if (message.guildId != process.env.GUILD!) return;
  //   if (message.author.bot) return;
  //   if (message.channelId != process.env.CHANNEL!) return;
  //   if (message.attachments.size == 0) return;
  //   message.react("🐍");

  //   const collector = message.createReactionCollector({
  //     filter: (reaction, user) =>
  //       reaction.emoji.name === "🐍" && !user.bot && user != message.author,
  //     max: 2,
  //   });

  //   collector.on("end", async (_, reason) => {
  //     if (reason === "limit") {
  //       await state.channel!.send(
  //         `<@${message.author.id}> has completed a bounty! nice!`,
  //       );
  //     } else {
  //       await state.channel!.send(
  //         `<@${message.author.id}> has completed a bouty but not enough people reacted to it which is kinda sad`,
  //       );
  //     }
  //   });
  // });
}
