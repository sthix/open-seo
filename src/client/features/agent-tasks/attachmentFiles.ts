import {
  ATTACHMENT_TYPES_BY_EXTENSION,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS,
  MAX_ATTACHMENTS_TOTAL_BYTES,
  type AttachmentInput,
} from "@/shared/agent-task-attachments";
import { getAgentTaskAttachment } from "@/serverFunctions/agentTasks";

const MB = 1024 * 1024;

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < MB) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / MB).toFixed(1)} MB`;
}

/** The same limits the server enforces, with a message a person can act on. */
export function checkFiles(files: File[]): string | undefined {
  if (files.length > MAX_ATTACHMENTS)
    return `Attach at most ${MAX_ATTACHMENTS} files.`;
  for (const file of files) {
    const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ATTACHMENT_TYPES_BY_EXTENSION[extension])
      return `${file.name}: only images, PDFs and text files can be attached.`;
    if (!file.size) return `${file.name} is empty.`;
    if (file.size > MAX_ATTACHMENT_BYTES)
      return `${file.name} is larger than ${MAX_ATTACHMENT_BYTES / MB} MB.`;
  }
  const total = files.reduce((sum, file) => sum + file.size, 0);
  if (total > MAX_ATTACHMENTS_TOTAL_BYTES)
    return `Attachments can be ${MAX_ATTACHMENTS_TOTAL_BYTES / MB} MB in total.`;
  return undefined;
}

export async function toAttachmentInput(file: File): Promise<AttachmentInput> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  // btoa takes a binary string; build it in chunks to stay under the
  // argument limit of String.fromCharCode.
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  return {
    fileName: file.name,
    contentType: file.type || undefined,
    contentBase64: btoa(binary),
  };
}

/** Fetches an attachment and hands it to the browser as a download. */
export async function downloadAttachment(
  projectId: string,
  taskId: string,
  attachmentId: string,
) {
  const file = await getAgentTaskAttachment({
    data: { projectId, taskId, attachmentId },
  });
  const bytes = Uint8Array.from(atob(file.contentBase64), (char) =>
    char.charCodeAt(0),
  );
  const url = URL.createObjectURL(
    new Blob([bytes], { type: file.contentType }),
  );
  const link = Object.assign(document.createElement("a"), {
    href: url,
    download: file.fileName,
  });
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
