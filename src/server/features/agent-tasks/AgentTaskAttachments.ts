import { env } from "cloudflare:workers";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { agentTaskAttachments } from "@/db/schema";
import { AppError } from "@/server/lib/errors";
import { deleteR2Prefix } from "@/server/lib/r2";
import {
  ATTACHMENT_ACCEPT,
  ATTACHMENT_TYPES_BY_EXTENSION,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS,
  MAX_ATTACHMENTS_TOTAL_BYTES,
  type AttachmentInput,
} from "@/shared/agent-task-attachments";

const ALLOWED_TYPES = new Set(Object.values(ATTACHMENT_TYPES_BY_EXTENSION));

export type AttachmentView = {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
};

type PreparedFile = {
  fileName: string;
  contentType: string;
  bytes: Uint8Array;
};

/** Checks every file before anything is stored, so a bad one stores none. */
function prepare(files: AttachmentInput[]): PreparedFile[] {
  if (files.length > MAX_ATTACHMENTS)
    throw new AppError(
      "VALIDATION_ERROR",
      `Attach at most ${MAX_ATTACHMENTS} files.`,
    );
  let total = 0;
  return files.map((file) => {
    // Keep the base name only, without path separators or control characters.
    const baseName = file.fileName.split(/[\\/]/).pop() ?? "";
    const fileName =
      Array.from(baseName)
        .filter((char) => char.charCodeAt(0) > 0x1f && char !== "\u007f")
        .join("")
        .trim() || "file";
    const extension = fileName.split(".").pop()?.toLowerCase() ?? "";
    const declared = file.contentType?.split(";")[0].trim().toLowerCase();
    const contentType =
      declared && ALLOWED_TYPES.has(declared)
        ? declared
        : ATTACHMENT_TYPES_BY_EXTENSION[extension];
    if (!contentType)
      throw new AppError(
        "VALIDATION_ERROR",
        `${fileName}: only images, PDFs and text files (${ATTACHMENT_ACCEPT}) can be attached.`,
      );
    const bytes = Buffer.from(file.contentBase64, "base64");
    if (!bytes.length)
      throw new AppError("VALIDATION_ERROR", `${fileName} is empty.`);
    if (bytes.length > MAX_ATTACHMENT_BYTES)
      throw new AppError(
        "VALIDATION_ERROR",
        `${fileName} is larger than ${MAX_ATTACHMENT_BYTES / 1024 / 1024} MB.`,
      );
    total += bytes.length;
    if (total > MAX_ATTACHMENTS_TOTAL_BYTES)
      throw new AppError(
        "VALIDATION_ERROR",
        `Attachments can be ${MAX_ATTACHMENTS_TOTAL_BYTES / 1024 / 1024} MB in total.`,
      );
    return { fileName, contentType, bytes };
  });
}

const taskPrefix = (projectId: string, taskId: string) =>
  `agent-tasks/${projectId}/${taskId}/`;

async function save(
  projectId: string,
  taskId: string,
  files: PreparedFile[],
): Promise<void> {
  for (const file of files) {
    const id = crypto.randomUUID();
    const r2Key = `${taskPrefix(projectId, taskId)}${id}`;
    await env.R2.put(r2Key, file.bytes, {
      httpMetadata: { contentType: file.contentType },
    });
    await db.insert(agentTaskAttachments).values({
      id,
      taskId,
      projectId,
      fileName: file.fileName,
      contentType: file.contentType,
      sizeBytes: file.bytes.length,
      r2Key,
    });
  }
}

async function listForTasks(
  projectId: string,
  taskIds: string[],
): Promise<Map<string, AttachmentView[]>> {
  const byTask = new Map<string, AttachmentView[]>();
  if (!taskIds.length) return byTask;
  const rows = await db
    .select()
    .from(agentTaskAttachments)
    .where(
      and(
        eq(agentTaskAttachments.projectId, projectId),
        inArray(agentTaskAttachments.taskId, taskIds),
      ),
    )
    .orderBy(asc(agentTaskAttachments.createdAt));
  for (const row of rows) {
    const views = byTask.get(row.taskId) ?? [];
    views.push({
      id: row.id,
      fileName: row.fileName,
      contentType: row.contentType,
      sizeBytes: row.sizeBytes,
    });
    byTask.set(row.taskId, views);
  }
  return byTask;
}

/** One attachment with its bytes, base64-encoded. */
async function read(projectId: string, taskId: string, attachmentId: string) {
  const [row] = await db
    .select()
    .from(agentTaskAttachments)
    .where(
      and(
        eq(agentTaskAttachments.projectId, projectId),
        eq(agentTaskAttachments.taskId, taskId),
        eq(agentTaskAttachments.id, attachmentId),
      ),
    )
    .limit(1);
  if (!row) throw new AppError("NOT_FOUND", "Attachment not found.");
  const object = await env.R2.get(row.r2Key);
  if (!object) throw new AppError("NOT_FOUND", "Attachment file is missing.");
  return {
    id: row.id,
    fileName: row.fileName,
    contentType: row.contentType,
    sizeBytes: row.sizeBytes,
    contentBase64: Buffer.from(await object.arrayBuffer()).toString("base64"),
  };
}

export const AgentTaskAttachments = {
  prepare,
  save,
  listForTasks,
  read,
  deleteForTask: (projectId: string, taskId: string) =>
    deleteR2Prefix(env.R2, taskPrefix(projectId, taskId)),
};

/** GDPR erasure: every attachment file of a project. */
export function deleteProjectAttachmentObjects(
  bucket: R2Bucket,
  projectId: string,
) {
  return deleteR2Prefix(bucket, `agent-tasks/${projectId}/`);
}
