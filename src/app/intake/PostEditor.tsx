"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import {
  SECTIONS,
  SECTION_HELP,
  SECTION_LABELS,
  SECTION_USES,
  type Section,
} from "@/lib/intake/sections";
import { SectionFields } from "./SectionFields";
import { Select } from "./Select";
import { dragDepth, firstImageFrom } from "@/lib/intake/editor-helpers";

export type EditablePost = {
  id: number | null;
  section: Section;
  title: string;
  summary: string;
  body: string;
  bannerUrl: string;
  fields: Record<string, unknown>;
  status: "draft" | "published";
};

async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch("/api/intake/upload", { method: "POST", body: form });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Upload failed.");
  return data.url as string;
}

/**
 * Wraps any area so files can be dropped on it, showing a highlight while a
 * drag is over it. dragenter/dragleave fire for every child element, so track a
 * depth counter rather than a boolean — otherwise moving across a child clears
 * the highlight while the pointer is still inside.
 */
function DropZone({
  onFile,
  className = "",
  children,
}: {
  onFile: (file: File) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const [over, setOver] = useState(false);
  const depth = useRef(0);

  return (
    <div
      onDragEnter={(e) => {
        e.preventDefault();
        depth.current = dragDepth(depth.current, "enter");
        setOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        depth.current = dragDepth(depth.current, "leave");
        if (depth.current === 0) setOver(false);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        depth.current = dragDepth(depth.current, "drop");
        setOver(false);
        const file = firstImageFrom(e.dataTransfer?.files);
        if (file) onFile(file);
      }}
      data-dragover={over}
      className={`relative transition-colors ${
        over ? "ring-2 ring-[#8b7cf6]/60 ring-offset-2 ring-offset-[#1a1e29] rounded-xl" : ""
      } ${className}`}
    >
      {children}
      {over ? (
        <div className="absolute inset-0 grid place-items-center rounded-xl bg-[#8b7cf6]/10 pointer-events-none">
          <span className="text-sm font-semibold text-[#f1f3f9]">Drop image to upload</span>
        </div>
      ) : null}
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`min-w-9 h-9 px-2.5 rounded-md text-sm font-medium transition-colors ${
        active
          ? "bg-[#8b7cf6]/20 text-[#f1f3f9] border border-[#8b7cf6]/40"
          : "text-slate-400 border border-transparent hover:text-[#f1f3f9] hover:bg-white/[0.06]"
      }`}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor, onInsertImage }: { editor: Editor; onInsertImage: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-white/[0.06]">
      <ToolbarButton
        label="Bold"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <strong>B</strong>
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <em>I</em>
      </ToolbarButton>
      <ToolbarButton
        label="Strikethrough"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <s>S</s>
      </ToolbarButton>

      <span className="w-px h-5 bg-white/10 mx-1" />

      {([2, 3] as const).map((level) => (
        <ToolbarButton
          key={level}
          label={`Heading ${level}`}
          active={editor.isActive("heading", { level })}
          onClick={() => editor.chain().focus().toggleHeading({ level }).run()}
        >
          H{level}
        </ToolbarButton>
      ))}

      <ToolbarButton
        label="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        •
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        1.
      </ToolbarButton>
      <ToolbarButton
        label="Quote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        ❝
      </ToolbarButton>
      <ToolbarButton
        label="Code block"
        active={editor.isActive("codeBlock")}
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
      >
        {"</>"}
      </ToolbarButton>

      <span className="w-px h-5 bg-white/10 mx-1" />

      <ToolbarButton
        label="Add link"
        active={editor.isActive("link")}
        onClick={() => {
          const previous = editor.getAttributes("link").href as string | undefined;
          const url = window.prompt("Link URL", previous ?? "https://");
          if (url === null) return;
          if (url === "") {
            editor.chain().focus().unsetLink().run();
            return;
          }
          editor.chain().focus().setLink({ href: url }).run();
        }}
      >
        🔗
      </ToolbarButton>
      <ToolbarButton label="Insert image" onClick={onInsertImage}>
        🖼
      </ToolbarButton>
    </div>
  );
}

export function PostEditor({ initial }: { initial: EditablePost }) {
  const router = useRouter();
  const [section, setSection] = useState<Section>(initial.section);
  const [title, setTitle] = useState(initial.title);
  const [summary, setSummary] = useState(initial.summary);
  const [bannerUrl, setBannerUrl] = useState(initial.bannerUrl);
  const [fields, setFields] = useState<Record<string, unknown>>(initial.fields ?? {});
  const [postId, setPostId] = useState<number | null>(initial.id);
  const uses = SECTION_USES[section];
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const bodyFileRef = useRef<HTMLInputElement>(null);
  const bannerFileRef = useRef<HTMLInputElement>(null);

  // The editor's drop/paste handlers need to insert images, but they're defined
  // as part of the editor's own config — a ref breaks that cycle and always
  // points at the current instance.
  const editorRef = useRef<Editor | null>(null);

  const insertUploadedImage = useCallback(async (file: File, at?: number) => {
    setError("");
    try {
      const url = await uploadImage(file);
      const ed = editorRef.current;
      if (!ed) return;
      if (typeof at === "number") {
        ed.chain().focus().insertContentAt(at, { type: "image", attrs: { src: url } }).run();
      } else {
        ed.chain().focus().setImage({ src: url }).run();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    }
  }, []);

  const editor = useEditor({
    // Tiptap renders on the client only; without this Next warns about an SSR
    // hydration mismatch for the contenteditable tree.
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Image.configure({ HTMLAttributes: { class: "rounded-lg" } }),
      Link.configure({ openOnClick: false, autolink: true }),
    ],
    content: initial.body || "",
    editorProps: {
      attributes: {
        class: "intake-prose focus:outline-none min-h-[22rem] px-4 py-4",
      },
      // Drop an image straight into the prose. Returning true tells ProseMirror
      // we handled it, so it doesn't also insert the file's name as text.
      handleDrop(view, event) {
        const file = firstImageFrom((event as DragEvent).dataTransfer?.files);
        if (!file) return false;
        event.preventDefault();
        // Insert at the drop point rather than the cursor, which is what people
        // expect when dragging into the middle of a paragraph.
        const at = view.posAtCoords({
          left: (event as DragEvent).clientX,
          top: (event as DragEvent).clientY,
        })?.pos;
        void insertUploadedImage(file, at);
        return true;
      },
      handlePaste(_view, event) {
        const file = firstImageFrom(event.clipboardData?.items);
        if (!file) return false;
        event.preventDefault();
        void insertUploadedImage(file);
        return true;
      },
    },
  });

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  const save = useCallback(
    async (status: "draft" | "published") => {
      if (!editor) return;
      if (!title.trim()) {
        setError("Give the post a title first.");
        return;
      }
      setBusy(true);
      setError("");
      setNotice("");

      const payload = {
        section,
        title: title.trim(),
        summary: summary.trim(),
        // Only news renders a body; sending the editor's empty "<p></p>" for the
        // other sections would show up as a stray blank paragraph.
        body: uses.body ? editor.getHTML() : "",
        bannerUrl: uses.image ? bannerUrl : "",
        fields,
        status,
      };

      try {
        const isNew = postId === null;
        const response = await fetch(
          isNew ? "/api/intake/posts" : `/api/intake/posts/${postId}`,
          {
            method: isNew ? "POST" : "PATCH",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Could not save.");

        if (isNew && data.post?.id) {
          setPostId(data.post.id);
          // Land on the post's own URL so a refresh doesn't create a duplicate.
          router.replace(`/intake/edit/${data.post.id}`);
        }
        setNotice(status === "published" ? "Published." : "Draft saved.");
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Could not save.");
      } finally {
        setBusy(false);
      }
    },
    [editor, section, title, summary, bannerUrl, fields, uses, postId, router],
  );

  async function handleFile(file: File | undefined, target: "body" | "banner") {
    if (!file) return;
    setError("");
    try {
      const url = await uploadImage(file);
      if (target === "banner") setBannerUrl(url);
      else editor?.chain().focus().setImage({ src: url }).run();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    }
  }

  async function remove() {
    if (postId === null) return;
    if (!window.confirm("Delete this post? This can't be undone.")) return;
    setBusy(true);
    const response = await fetch(`/api/intake/posts/${postId}`, { method: "DELETE" });
    setBusy(false);
    if (response.ok) {
      router.replace("/intake");
      router.refresh();
    } else {
      setError("Could not delete.");
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_18rem] gap-6 items-start">
      <div className="min-w-0">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post title"
          aria-label="Post title"
          className="w-full bg-transparent text-3xl sm:text-4xl font-bold text-[#f1f3f9] placeholder-slate-600 outline-none mb-4"
        />

        {uses.summary ? (
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder={
              uses.body
                ? "Short summary (optional — shown in listings)"
                : "Description (shown on the card)"
            }
            aria-label="Summary"
            rows={2}
            className="w-full bg-white/[0.03] border border-white/[0.08] rounded-lg px-4 py-2.5 text-slate-300 text-sm placeholder-slate-600 outline-none focus:border-white/20 resize-y mb-5"
          />
        ) : null}

        {uses.body ? (
          <div className="surface-card overflow-hidden">
            {editor ? (
              <>
                <Toolbar editor={editor} onInsertImage={() => bodyFileRef.current?.click()} />
                {/* Tiptap's own handleDrop places the image at the drop point;
                    this wrapper only supplies the highlight. */}
                <DropZone onFile={(file) => void insertUploadedImage(file)}>
                  <EditorContent editor={editor} />
                </DropZone>
                <p className="px-4 pb-3 text-xs text-slate-600">
                  Drag an image in, or paste one from your clipboard.
                </p>
              </>
            ) : (
              <div className="p-6 text-slate-500 text-sm">Loading editor…</div>
            )}
          </div>
        ) : (
          <div className="surface-card p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
              {SECTION_LABELS[section]} details
            </p>
            <SectionFields section={section} fields={fields} onChange={setFields} />
          </div>
        )}

        <input
          ref={bodyFileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            void handleFile(e.target.files?.[0], "body");
            e.target.value = "";
          }}
        />
      </div>

      <aside className="grid gap-4 lg:sticky lg:top-24">
        <div className="surface-card p-5">
          <label
            htmlFor="intake-section"
            className="block text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2"
          >
            Post to
          </label>
          <Select
            id="intake-section"
            ariaLabel="Post to"
            value={section}
            options={SECTIONS.map((s) => ({ value: s, label: SECTION_LABELS[s] }))}
            onChange={(next) => {
              // Fields are section-specific; carrying them across would submit
              // a venue to Partners. Start clean on every switch.
              setSection(next as Section);
              setFields({});
            }}
          />
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">{SECTION_HELP[section]}</p>
        </div>

        {/* News keeps its body in the main column, so its extra fields live here. */}
        {uses.body ? (
          <div className="surface-card p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
              Details
            </p>
            <SectionFields section={section} fields={fields} onChange={setFields} />
          </div>
        ) : null}

        {uses.image ? (
          <DropZone onFile={(file) => void handleFile(file, "banner")}>
            <div className="surface-card p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
                Banner
              </p>
              {bannerUrl ? (
                <div className="mb-3">
                  <div className="media-frame rounded-lg overflow-hidden aspect-[3/2] mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={bannerUrl}
                      alt="Banner preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setBannerUrl("")}
                    className="text-xs text-slate-500 hover:text-[#f1f3f9] transition-colors"
                  >
                    Remove banner
                  </button>
                </div>
              ) : (
                <div className="mb-3 rounded-lg border border-dashed border-white/[0.12] px-3 py-6 text-center">
                  <p className="text-sm text-slate-500">Drag an image here</p>
                  <p className="text-xs text-slate-600 mt-1">or use the button below</p>
                </div>
              )}
              <button
                type="button"
                onClick={() => bannerFileRef.current?.click()}
                className="action-chip w-full text-xs"
              >
                <span>{bannerUrl ? "Replace" : "Choose file"}</span>
              </button>
              <input
                ref={bannerFileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  void handleFile(e.target.files?.[0], "banner");
                  e.target.value = "";
                }}
              />
            </div>
          </DropZone>
        ) : null}

        <div className="surface-card p-5 grid gap-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Publish</p>

          {error ? (
            <p role="alert" className="text-sm text-red-300">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p role="status" className="text-sm text-[#e0b563]">
              {notice}
            </p>
          ) : null}

          <button
            type="button"
            disabled={busy}
            onClick={() => save("draft")}
            className="action-chip w-full text-xs disabled:opacity-50"
          >
            <span>{busy ? "Saving…" : "Save draft"}</span>
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => save("published")}
            className="w-full px-4 py-2.5 text-sm font-semibold rounded-lg text-white bg-[#5b3f96] hover:bg-[#4c3480] transition-colors disabled:opacity-50"
          >
            Publish
          </button>

          {postId !== null ? (
            <button
              type="button"
              disabled={busy}
              onClick={remove}
              className="text-xs text-slate-500 hover:text-red-300 transition-colors disabled:opacity-50"
            >
              Delete post
            </button>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
