import { apiDelete, apiGet, apiPost, isLive } from "./http";

export interface Reminder {
  id: string;
  title: string;
  remindAt: string;
  type: string;
  createdAt: string;
}

/** List reminders (M7 GET /reminders). Returns null when offline. */
export async function listReminders(): Promise<Reminder[] | null> {
  if (!isLive()) return null;
  try {
    return await apiGet<Reminder[]>("/reminders");
  } catch (e) {
    console.warn("listReminders failed:", e);
    return null;
  }
}

/** Create a reminder (M7 POST /reminders). date + time (HTML inputs) → ISO. */
export async function createReminder(input: {
  title: string;
  date: string;
  time?: string;
  type?: string;
}): Promise<Reminder | null> {
  if (!isLive()) return null;
  try {
    const remindAt = new Date(`${input.date}T${input.time || "12:00"}:00`).toISOString();
    return await apiPost<Reminder>("/reminders", {
      title: input.title,
      remindAt,
      type: input.type || "general",
    });
  } catch (e) {
    console.warn("createReminder failed:", e);
    return null;
  }
}

/** Delete a reminder (M7 DELETE /reminders/:id). */
export async function deleteReminder(id: string): Promise<boolean> {
  if (!isLive()) return false;
  try {
    await apiDelete(`/reminders/${id}`);
    return true;
  } catch (e) {
    console.warn("deleteReminder failed:", e);
    return false;
  }
}
