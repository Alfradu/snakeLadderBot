import express, { Request, Response } from "express";
import multer from "multer";
import cors from "cors";
import { AttachmentBuilder } from "discord.js";
import { state } from "./bot.js";

const upload = multer({ storage: multer.memoryStorage() });

const app = express();

app.use(
  cors({
    allowedHeaders: ["Content-Type", "X-Api-Key"],
  }),
);

app.use((req: Request, res: Response, next) => {
  const key = req.headers["x-api-key"];
  if (!key || key !== process.env.API_KEY) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
});

interface BountyBody {
  bountyId: string;
  playerId: string;
  contributorIds?: string | string[];
}

app.post(
  "/bounty",
  upload.single("image"),
  async (req: Request, res: Response) => {
    const channel = state.channel;
    if (!channel) {
      res.status(503).json({ error: "Bot not ready" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: "image field required" });
      return;
    }

    const { bountyId, playerId, contributorIds } = req.body as BountyBody;

    if (!bountyId || !playerId) {
      res.status(400).json({ error: "bountyId and playerId are required" });
      return;
    }

    const rawContributors = Array.isArray(contributorIds)
      ? contributorIds
      : typeof contributorIds === "string"
        ? contributorIds.split(",")
        : [];
    const parsedContributorIds = rawContributors
      .map((id) => parseInt(id.trim(), 10))
      .filter((n) => !isNaN(n));

    const parsedBountyId = parseInt(bountyId, 10);
    const parsedPlayerId = parseInt(playerId, 10);

    const attachment = new AttachmentBuilder(req.file.buffer, {
      name: req.file.originalname || "bounty.png",
    });

    const posted = await channel.send({
      content:
        `**Bounty #${parsedBountyId}** submitted by player ${parsedPlayerId}` +
        (parsedContributorIds.length > 0
          ? `\nContributors: ${parsedContributorIds.join(", ")}`
          : ""),
      files: [attachment],
    });

    await posted.react("🐍");

    const collector = posted.createReactionCollector({
      filter: (reaction, user) =>
        reaction.emoji.name === "🐍" && !user.bot,
      max: 2,
    });

    collector.on("end", async (_, reason) => {
      if (reason === "limit") {
        await channel.send(
          `Bounty #${parsedBountyId} for player ${parsedPlayerId} has been verified! nice!`,
        );
        // TODO: send DB update here
      } else {
        await channel.send(
          `Bounty #${parsedBountyId} did not receive enough reactions which is kinda sad`,
        );
      }
    });

    res.status(202).json({ messageId: posted.id });
  },
);

export function startApi(port: number): void {
  app.listen(port, () => {
    console.log(`API listening on port ${port}`);
  });
}
