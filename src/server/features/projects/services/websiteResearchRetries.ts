import { AppError } from "@/server/lib/errors";
import { NoObjectGeneratedError } from "ai";

export const SEARCH_RETRIES = 3;
// Time the competitor search may spend on retries. A failing DataForSEO
// search can take about 20 seconds per attempt, so retrying all of them would
// spend most of the research deadline and the whole setup would time out.
// Once the budget is spent, the search counts as an outage and research goes
// on without competitors.
export const SEARCH_RETRY_BUDGET_MS = 30_000;
const OUTPUT_RETRIES = 2;

// DataForSEO's own search backend failing (e.g. 40101), not a problem with our
// request or account.
export function isSearchOutage(error: unknown): error is AppError {
  return error instanceof AppError && error.code === "UPSTREAM_UNAVAILABLE";
}

// The model occasionally ends with text that isn't valid JSON. One deadline
// covers every attempt so retries stay inside the research-setup step.
export async function retryInvalidOutput<T>(
  generate: (abortSignal: AbortSignal) => Promise<T>,
  deadlineMs: number,
) {
  const abortSignal = AbortSignal.timeout(deadlineMs);
  for (let attempt = 0; ; attempt++) {
    try {
      return await generate(abortSignal);
    } catch (error) {
      // The deadline aborts mid-request with a bare TimeoutError.
      if (abortSignal.aborted)
        throw new AppError(
          "INTERNAL_ERROR",
          "Website research took too long. Please try again.",
        );
      if (
        attempt === OUTPUT_RETRIES ||
        !NoObjectGeneratedError.isInstance(error)
      )
        throw error;
    }
  }
}
