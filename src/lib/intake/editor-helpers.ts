// Pure logic pulled out of the intake editor components so it can be tested
// without a DOM harness. These are the bits that break silently: off-by-one
// keyboard navigation, and picking the right file out of a drag payload.

export type SelectKeyAction =
  | { type: "open" }
  | { type: "close" }
  | { type: "move"; index: number }
  | { type: "commit"; index: number }
  | { type: "none" };

/**
 * Maps a keypress on the custom Select to an action.
 * Movement clamps at both ends rather than wrapping, matching a native select.
 */
export function selectKeyAction(
  key: string,
  { open, activeIndex, length }: { open: boolean; activeIndex: number; length: number },
): SelectKeyAction {
  if (length === 0) return { type: "none" };

  if (!open) {
    return ["ArrowDown", "ArrowUp", "Enter", " "].includes(key)
      ? { type: "open" }
      : { type: "none" };
  }

  const clamp = (i: number) => Math.max(0, Math.min(length - 1, i));

  switch (key) {
    case "Escape":
    case "Tab":
      return { type: "close" };
    case "ArrowDown":
      return { type: "move", index: clamp(activeIndex + 1) };
    case "ArrowUp":
      return { type: "move", index: clamp(activeIndex - 1) };
    case "Home":
      return { type: "move", index: 0 };
    case "End":
      return { type: "move", index: length - 1 };
    case "Enter":
    case " ":
      return { type: "commit", index: clamp(activeIndex) };
    default:
      return { type: "none" };
  }
}

type FileLike = { type?: string; getAsFile?: () => File | null };

/**
 * First image in a drag or paste payload, or null.
 *
 * Drops carry a FileList; pastes carry a DataTransferItemList whose entries
 * need getAsFile(). Non-image entries (dragged text, a .zip alongside a photo)
 * must be skipped rather than uploaded.
 */
export function firstImageFrom(
  list: ArrayLike<FileLike> | null | undefined,
): File | null {
  if (!list) return null;
  for (const entry of Array.from(list)) {
    if (!entry) continue;
    const file = typeof entry.getAsFile === "function" ? entry.getAsFile() : (entry as File);
    if (file && typeof file.type === "string" && file.type.startsWith("image/")) {
      return file as File;
    }
  }
  return null;
}

/**
 * dragenter/dragleave fire once per child element, so a boolean "is over" flag
 * flickers off as the pointer crosses children. Track depth instead.
 */
export function dragDepth(current: number, event: "enter" | "leave" | "drop"): number {
  if (event === "drop") return 0;
  const next = event === "enter" ? current + 1 : current - 1;
  return Math.max(0, next);
}
