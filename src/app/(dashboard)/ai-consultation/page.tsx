"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  chatAI,
  gatherContext,
  listConversations,
  saveConversation,
  deleteConversation,
  newConversation,
  deriveTitle,
  STARTER_PROMPTS,
  type Conversation,
  type ChatMsg,
  type AiBusinessContext,
  type ChatSource,
} from "../../../lib/ai-consultation";
import {
  Bot,
  Copy,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  StopCircle,
  Trash2,
  User,
} from "lucide-react";

// ── Lightweight, XSS-safe markdown renderer (headers, bold, lists, code) ────────
function inline(s: string): React.ReactNode {
  return s
    .split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
    .filter(Boolean)
    .map((p, i) => {
      if (p.startsWith("**") && p.endsWith("**")) return <strong key={i}>{p.slice(2, -2)}</strong>;
      if (p.startsWith("`") && p.endsWith("`"))
        return (
          <code key={i} className="bg-surface-container-high px-1 rounded text-xs font-mono">
            {p.slice(1, -1)}
          </code>
        );
      return <span key={i}>{p}</span>;
    });
}
function MarkdownLite({ text }: { text: string }) {
  const lines = text.split("\n");
  const els: React.ReactNode[] = [];
  let list: string[] = [];
  const flush = (key: string) => {
    if (list.length) {
      els.push(
        <ul key={key} className="list-disc pl-5 space-y-1 my-2">
          {list.map((li, i) => (
            <li key={i}>{inline(li)}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };
  lines.forEach((raw, i) => {
    const line = raw.trimEnd();
    if (/^#{1,3}\s/.test(line)) {
      flush(`u${i}`);
      const t = line.replace(/^#+\s/, "");
      els.push(
        <p key={i} className="font-bold text-on-surface text-sm mt-3 mb-1">
          {inline(t)}
        </p>,
      );
    } else if (/^[-*]\s/.test(line)) {
      list.push(line.replace(/^[-*]\s/, ""));
    } else if (line === "") {
      flush(`u${i}`);
    } else {
      flush(`u${i}`);
      els.push(
        <p key={i} className="my-1 leading-relaxed">
          {inline(line)}
        </p>,
      );
    }
  });
  flush("uEnd");
  return <div className="text-sm text-on-surface">{els}</div>;
}

export default function AiConsultationPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [generating, setGenerating] = useState(false);
  const [context, setContext] = useState<AiBusinessContext | null>(null);
  const [search, setSearch] = useState("");
  const [lastSources, setLastSources] = useState<ChatSource[]>([]);
  const cancelRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const existing = listConversations();
    if (existing.length > 0) {
      setConversations(existing);
      setActiveId(existing[0].id);
    } else {
      const c = newConversation();
      saveConversation(c);
      setConversations([c]);
      setActiveId(c.id);
    }
    gatherContext().then(setContext);
  }, []);

  const active = useMemo(() => conversations.find((c) => c.id === activeId) ?? null, [conversations, activeId]);
  const messages = active?.messages ?? [];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, generating]);

  const persist = (conv: Conversation) => {
    saveConversation(conv);
    setConversations(listConversations());
  };

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !active || generating) return;
    setInput("");
    const userMsg: ChatMsg = { role: "user", content: trimmed };
    const withUser: Conversation = {
      ...active,
      messages: [...active.messages, userMsg],
      title: active.messages.length === 0 ? deriveTitle([userMsg]) : active.title,
      updatedAt: Date.now(),
    };
    persist(withUser);
    setGenerating(true);
    cancelRef.current = false;
    const res = await chatAI(withUser.messages, context ?? undefined);
    if (cancelRef.current) {
      setGenerating(false);
      return;
    }
    const reply = res?.reply ?? "Maaf, layanan AI sedang tidak tersedia. Silakan coba lagi.";
    setLastSources(res?.sources ?? []);
    persist({
      ...withUser,
      messages: [...withUser.messages, { role: "assistant", content: reply }],
      updatedAt: Date.now(),
    });
    setGenerating(false);
  };

  const regenerate = async () => {
    if (!active || generating || active.messages.length === 0) return;
    const msgs = [...active.messages];
    if (msgs[msgs.length - 1]?.role === "assistant") msgs.pop();
    const lastUser = [...msgs].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    persist({ ...active, messages: msgs, updatedAt: Date.now() });
    await send(lastUser.content);
  };

  const startNew = () => {
    const c = newConversation();
    saveConversation(c);
    setConversations(listConversations());
    setActiveId(c.id);
  };

  const removeConv = (id: string) => {
    deleteConversation(id);
    const rest = listConversations();
    setConversations(rest);
    if (activeId === id) setActiveId(rest[0]?.id ?? null);
    if (rest.length === 0) startNew();
  };

  const renameConv = (id: string) => {
    const c = conversations.find((x) => x.id === id);
    if (!c) return;
    const name = window.prompt("Ubah nama percakapan:", c.title);
    if (name && name.trim()) persist({ ...c, title: name.trim(), updatedAt: c.updatedAt });
  };

  const filtered = conversations.filter((c) =>
    search ? c.title.toLowerCase().includes(search.toLowerCase()) : true,
  );

  return (
    <div className="h-full w-full flex overflow-hidden bg-surface-bright">
      {/* Conversation sidebar */}
      <aside className="w-64 border-r border-outline-variant bg-surface-container-low hidden md:flex flex-col">
        <div className="p-3 border-b border-outline-variant">
          <button
            onClick={startNew}
            className="w-full bg-primary text-on-primary font-semibold text-sm py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-surface-tint transition-colors"
          >
            <Plus className="size-4" /> Percakapan Baru
          </button>
          <div className="relative mt-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3.5 text-on-surface-variant" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari percakapan…"
              className="w-full pl-7 pr-2 py-1.5 text-xs bg-surface border border-outline-variant rounded-md outline-none focus:border-primary"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filtered.map((c) => (
            <div
              key={c.id}
              className={`group rounded-lg px-2.5 py-2 cursor-pointer flex items-center gap-2 ${c.id === activeId ? "bg-primary/10 border border-primary/30" : "hover:bg-surface"}`}
              onClick={() => setActiveId(c.id)}
            >
              <Bot className="size-3.5 text-on-surface-variant shrink-0" />
              <span className="flex-1 text-xs font-medium text-on-surface truncate">{c.title}</span>
              <button onClick={(e) => { e.stopPropagation(); renameConv(c.id); }} className="opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-primary" title="Ubah nama">
                <Pencil className="size-3.5" />
              </button>
              <button onClick={(e) => { e.stopPropagation(); removeConv(c.id); }} className="opacity-0 group-hover:opacity-100 text-on-surface-variant hover:text-error" title="Hapus">
                <Trash2 className="size-3.5" />
              </button>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-[11px] text-on-surface-variant text-center py-4">Tidak ada percakapan.</p>}
        </div>
      </aside>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="px-5 py-3 border-b border-outline-variant flex items-center justify-between bg-surface-container-lowest">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-on-primary flex items-center justify-center">
              <Sparkles className="size-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-on-surface">Konsultasi Mentor Ekspor AI</h1>
              <p className="text-[11px] text-on-surface-variant">
                {context?.product_name ? `Dikontekskan ke: ${context.product_name}` : "Asisten ekspor berbasis data Anda"}
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <button onClick={regenerate} disabled={generating} className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline disabled:opacity-40">
              <RefreshCw className="size-3.5" /> Regenerasi
            </button>
          )}
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5">
          {messages.length === 0 ? (
            <div className="max-w-2xl mx-auto text-center pt-8">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4">
                <Bot className="size-7" />
              </div>
              <h2 className="text-lg font-bold text-on-surface mb-1">Halo! Saya Mentor Ekspor AI Anda.</h2>
              <p className="text-sm text-on-surface-variant mb-6">
                Saya menjawab menggunakan data produk, pasar, dan pembeli nyata Anda. Coba salah satu:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
                {STARTER_PROMPTS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-xs text-on-surface bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2.5 hover:border-primary transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
                {m.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg bg-primary text-on-primary flex items-center justify-center shrink-0">
                    <Bot className="size-4" />
                  </div>
                )}
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${m.role === "user" ? "bg-primary text-on-primary" : "bg-surface-container-lowest border border-outline-variant"}`}>
                  {m.role === "assistant" ? (
                    <>
                      <MarkdownLite text={m.content} />
                      <button
                        onClick={() => navigator.clipboard?.writeText(m.content)}
                        className="mt-2 text-[11px] text-on-surface-variant hover:text-primary flex items-center gap-1"
                      >
                        <Copy className="size-3" /> Salin
                      </button>
                    </>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                  )}
                </div>
                {m.role === "user" && (
                  <div className="w-7 h-7 rounded-lg bg-surface-container-high text-on-surface-variant flex items-center justify-center shrink-0">
                    <User className="size-4" />
                  </div>
                )}
              </div>
            ))
          )}
          {generating && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-primary text-on-primary flex items-center justify-center shrink-0">
                <Bot className="size-4" />
              </div>
              <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl px-4 py-3 flex items-center gap-2 text-xs text-on-surface-variant">
                <Loader2 className="size-4 animate-spin" /> Menganalisis data Anda…
              </div>
            </div>
          )}
          {lastSources.length > 0 && !generating && messages.length > 0 && (
            <div className="max-w-[80%] ml-10 flex flex-wrap gap-1.5">
              {lastSources.map((s, i) => (
                <span key={i} className="text-[10px] font-medium text-on-surface-variant bg-surface-container-high px-1.5 py-0.5 rounded" title={s.category}>
                  📚 {s.title}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-outline-variant bg-surface-container-lowest">
          <div className="max-w-3xl mx-auto flex items-end gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              rows={1}
              placeholder="Tanyakan tentang ekspor, pembeli, pasar, HS, negosiasi…"
              className="flex-1 resize-none max-h-32 px-3 py-2.5 text-sm bg-surface border border-outline-variant rounded-xl outline-none focus:border-primary"
            />
            {generating ? (
              <button
                onClick={() => { cancelRef.current = true; setGenerating(false); }}
                className="p-2.5 bg-error text-white rounded-xl hover:opacity-90"
                title="Berhenti"
              >
                <StopCircle className="size-5" />
              </button>
            ) : (
              <button
                onClick={() => void send(input)}
                disabled={!input.trim()}
                className="p-2.5 bg-primary text-on-primary rounded-xl hover:bg-surface-tint disabled:opacity-40 transition-colors"
                title="Kirim"
              >
                <Send className="size-5" />
              </button>
            )}
          </div>
          <p className="max-w-3xl mx-auto text-[10px] text-on-surface-variant text-center mt-2">
            Jawaban dikontekskan dengan data nyata Anda (produk, pasar, pembeli) + basis pengetahuan ekspor. Verifikasi keputusan penting.
          </p>
        </div>
      </div>
    </div>
  );
}
