import { z } from "zod";

// Files a person hands the coding agent with a task: screenshots, copy, data,
// PDFs. Limited to what Claude Code can read (images, PDFs and text) and
// small enough to go through a JSON request as base64.
export const MAX_ATTACHMENTS = 10;
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const MAX_ATTACHMENTS_TOTAL_BYTES = 25 * 1024 * 1024;

export const ATTACHMENT_TYPES_BY_EXTENSION: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  pdf: "application/pdf",
  txt: "text/plain",
  md: "text/markdown",
  csv: "text/csv",
  json: "application/json",
  html: "text/html",
  htm: "text/html",
};
export const ATTACHMENT_ACCEPT = Object.keys(ATTACHMENT_TYPES_BY_EXTENSION)
  .map((extension) => `.${extension}`)
  .join(",");

export const attachmentInputSchema = z.object({
  fileName: z.string().trim().min(1).max(200),
  contentType: z.string().max(200).optional(),
  contentBase64: z.string().min(1),
});
export type AttachmentInput = z.infer<typeof attachmentInputSchema>;
