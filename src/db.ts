import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
);

export async function getUserById(id: number) {
  const { data, error } = await supabase
    .from("user")
    .select("id, username, score")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as { id: number; username: string; score: number };
}

export async function getTaskById(id: number) {
  const { data, error } = await supabase
    .from("task")
    .select("id, title, primary_points, secondary_points, slot")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as {
    id: number;
    title: string;
    primary_points: number;
    secondary_points: number;
    slot: number;
  };
}

export async function completeTask(
  taskId: number,
  playerId: number,
  contributorIds: number[],
  primaryPoints: number,
  secondaryPoints: number,
): Promise<void> {
  const player = await getUserById(playerId);

  await supabase
    .from("task")
    .update({ completed: true, pending: false, slot: null })
    .eq("id", taskId)
    .throwOnError();

  await supabase
    .from("user")
    .update({ score: player.score + primaryPoints })
    .eq("id", playerId)
    .throwOnError();

  for (const contributorId of contributorIds) {
    const contributor = await getUserById(contributorId);
    await supabase
      .from("user")
      .update({ score: contributor.score + secondaryPoints })
      .eq("id", contributorId)
      .throwOnError();
  }
}

export async function getRollableTasks() {
  const { data, error } = await supabase
    .from("task")
    .select("id, title")
    .eq("completed", false)
    .eq("pending", false)
    .is("slot", null);
  if (error) throw error;
  return data as { id: number; title: string }[];
}

export async function rollTaskForSlot(
  slot: number,
  task: { id: number; title: string },
): Promise<void> {
  await supabase
    .from("task")
    .update({ slot: slot })
    .eq("id", task.id)
    .throwOnError();
}
