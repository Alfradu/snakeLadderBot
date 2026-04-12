import express, { NextFunction, Request, Response } from "express";
import multer from "multer";
import cors from "cors";
import { AttachmentBuilder } from "discord.js";
import { state } from "./bot.js";
import {
  getUserById,
  completeTask,
  rollTaskForSlot,
  getRollableTasks,
  getTaskById,
  insertHistory,
} from "./db.js";

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

    const player = await getUserById(parsedPlayerId);

    const attachment = new AttachmentBuilder(req.file.buffer, {
      name: req.file.originalname || "bounty.png",
    });
    var taskToComplete = await getTaskById(parsedBountyId);
    const posted = await channel.send({
      content:
        `**${taskToComplete.title}** completed by ${player.username}` +
        (parsedContributorIds.length > 0
          ? `\nContributors: ${parsedContributorIds.join(", ")}`
          : ""),
      files: [attachment],
    });

    await posted.react("🐍");

    const collector = posted.createReactionCollector({
      filter: (reaction, user) => reaction.emoji.name === "🐍" && !user.bot,
      max: 2,
    });

    collector.on("end", async (_, reason) => {
      if (reason === "limit") {
        await channel.send(
          `${taskToComplete.title} completed by ${player.username} has been verified! nice!`,
        );
        try {
          await completeTask(
            parsedBountyId,
            parsedPlayerId,
            parsedContributorIds,
            taskToComplete.primary_points,
            taskToComplete.secondary_points,
          );
          await insertHistory(
            parsedPlayerId,
            parsedBountyId,
            parsedContributorIds,
          );
          var tasks = await getRollableTasks();
          if (tasks.length > 0) {
            const chosenTask = tasks[Math.floor(Math.random() * tasks.length)];
            await rollTaskForSlot(taskToComplete.slot, chosenTask);
            await channel.send(`New Bounty Rolled! **${chosenTask.title}**`);
          }
        } catch (err) {
          const message =
            err instanceof Error ? err.message : JSON.stringify(err, null, 2);
          console.error("DB update failed after bounty completion:", message);
        }
      } else {
        await channel.send(
          `Bounty #${parsedBountyId} did not receive enough reactions which is kinda sad`,
        );
      }
    });

    res.status(202).json({ messageId: posted.id });
  },
);

app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
  const message =
    err instanceof Error ? err.message : JSON.stringify(err, null, 2);
  const stack = err instanceof Error ? err.stack : undefined;
  console.error("Unhandled error on", req.method, req.path);
  console.error("Error:", message);
  if (stack) console.error("Stack:", stack);
  res.status(500).json({ error: message });
});

export function startApi(port: number): void {
  app.listen(port, () => {
    console.log(`API listening on port ${port}`);
  });
}
