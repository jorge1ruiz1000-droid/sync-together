import { AlertTriangle } from "lucide-react";
import { ApiError, fieldErrors } from "@/lib/api";
import { cn } from "@/lib/utils";

/** Surfaces the API's error envelope as a friendly message + any field errors. */
export function ApiErrorBox({ error, className }: { error: unknown; className?: string }) {
  if (!error) return null;
  const api = error instanceof ApiError ? error : null;
  const rawMessage = error instanceof Error ? error.message : String(error);
  const message = friendlyMessage(rawMessage);
  const details = (api ? fieldErrors(api.payload) : []).map(friendlyMessage);

  return (
    <div className={cn("rounded-md border border-destructive/40 bg-destructive/10 p-3", className)}>
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" strokeWidth={1.75} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-destructive">Request failed</p>
          <p className="mt-0.5 break-words text-sm text-foreground/80">{message}</p>
          {details.length > 0 ? (
            <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
              {details.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function friendlyMessage(message: string) {
  const trimmed = message.trim();
  if (!trimmed) return "Something went wrong. Please try again.";
  if (/operator[_ ]?id.*(required|missing)/i.test(trimmed)) return "Select a client";
  if (/^internal server error$/i.test(trimmed))
    return "Something went wrong on our end. Please try again.";
  if (/^request failed(\s*\(\d+\))?$/i.test(trimmed))
    return "Something went wrong. Please try again.";
  // Strip trailing "(500)" style status codes.
  return trimmed.replace(/\s*\(\d{3}\)\s*$/, "");
}
