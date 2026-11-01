import {
  BACKUP_TABLES,
  DEFAULT_WORKSPACE_PROFILE,
  assertBackupLimits,
} from "../data/backup";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

function strip(doc: Record<string, unknown>) {
  const { _id, _creationTime: _time, ownerId: _owner, ...data } = doc;
  return { id: String(_id), ...data };
}

/** All collections are read in the same database snapshot, never from UI caches. */
export async function readWorkspaceSnapshot(
  ctx: QueryCtx | MutationCtx,
  ownerId: Id<"users">,
) {
  const collections = Object.fromEntries(
    await Promise.all(
      BACKUP_TABLES.map(async (table) => {
        const rows = await ctx.db
          .query(table)
          .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
          .collect();
        return [table, rows.map(strip)];
      }),
    ),
  );
  const workspace = await ctx.db
    .query("workspaces")
    .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
    .unique();
  const { id: _profileId, ...profile } = workspace
    ? strip(workspace)
    : { id: "", ...DEFAULT_WORKSPACE_PROFILE };
  return {
    version: 1 as const,
    exportedAt: new Date().toISOString(),
    profile,
    ...collections,
  };
}

/** Failed capacity checks roll the entire mutation back, including its writes. */
export async function assertWorkspaceCapacity(
  ctx: MutationCtx,
  ownerId: Id<"users">,
) {
  assertBackupLimits(await readWorkspaceSnapshot(ctx, ownerId));
}
