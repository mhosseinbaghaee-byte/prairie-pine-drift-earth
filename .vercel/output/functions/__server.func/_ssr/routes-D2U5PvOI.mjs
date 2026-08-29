import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { y as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { a as object, n as array, o as string, t as _enum } from "../_libs/zod.mjs";
import { a as Send, c as GraduationCap, d as BookOpen, i as Trash2, l as Brain, n as Volume2, o as Plus, s as MessageCircle, t as VolumeX, u as Bookmark } from "../_libs/lucide-react.mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { t as Slot } from "../_libs/radix-ui__react-slot.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-D2U5PvOI.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var MessageSchema = object({
	role: _enum(["user", "assistant"]),
	content: string().min(1).max(6e3)
});
var ChatInput = object({
	messages: array(MessageSchema).min(1).max(16),
	level: _enum([
		"kid",
		"teen",
		"adult"
	]),
	mode: _enum([
		"chat",
		"daily",
		"lesson"
	])
});
var QuizInput = object({
	topic: string().min(1).max(80),
	level: _enum([
		"kid",
		"teen",
		"adult"
	])
});
var SpeakInput = object({ text: string().min(1).max(800) });
var FactInput = object({ level: _enum([
	"kid",
	"teen",
	"adult"
]) });
var askPouya = createServerFn({ method: "POST" }).validator((input) => ChatInput.parse(input)).handler(createSsrRpc("43edcad30e7fee0c4d47e311d235a376d258312d6d9f27586d1c3cefefdfb059"));
var makeQuiz = createServerFn({ method: "POST" }).validator((input) => QuizInput.parse(input)).handler(createSsrRpc("7706dc834ca3dea6541d1a8bf1cdb60a4caadbec4d7072d30b42ffde98d0f7ab"));
createServerFn({ method: "POST" }).validator((input) => FactInput.parse(input)).handler(createSsrRpc("37ca95f500f98676e12fa6cba9976368fda36e5493ec0fa5816fc955f69e147b"));
var speakPouya = createServerFn({ method: "POST" }).validator((input) => SpeakInput.parse(input)).handler(createSsrRpc("219e45791ab663a67c9f72d785c784ba88f10bbae8fec56e7c2cebeaab631fcb"));
var LEVELS = [
	{
		id: "kid",
		label: "ساده",
		hint: "مثل توضیح برای یک کنجکاو ده ساله"
	},
	{
		id: "teen",
		label: "متوسط",
		hint: "دقیق، با مثال و کمی عمق"
	},
	{
		id: "adult",
		label: "عمیق",
		hint: "دانشگاهی، با nuance و منبع فکر"
	}
];
var TOPICS = [
	{
		id: "science",
		label: "علوم",
		prompt: "یک درس کوتاه و زنده درباره یک مفهوم علمی جذاب بده که خیلی‌ها اشتباه می‌فهمند."
	},
	{
		id: "history",
		label: "تاریخ",
		prompt: "یک داستان تاریخی کمترشنیده‌شده بگو و توضیح بده چرا هنوز به کار امروز می‌آید."
	},
	{
		id: "geo",
		label: "جغرافیا",
		prompt: "یک جای شگفت‌انگیز روی زمین را معرفی کن و بگو چه چیزی آن را خاص کرده."
	},
	{
		id: "math",
		label: "ریاضی",
		prompt: "یک ایده ریاضی را طوری توضیح بده که حس کشف داشته باشد، نه فرمول خشک."
	},
	{
		id: "lang",
		label: "زبان",
		prompt: "یک نکته زبانی فارسی یا مقایسه فارسی و انگلیسی که enticing باشد درس بده."
	},
	{
		id: "health",
		label: "سلامت",
		prompt: "یک باور رایج درباره بدن یا مغز را بررسی کن و نسخه دقیق‌ترش را بگو."
	},
	{
		id: "tech",
		label: "فناوری",
		prompt: "یک مفهوم فناوری را ساده، درست و بدون هیاهو توضیح بده."
	},
	{
		id: "culture",
		label: "فرهنگ",
		prompt: "یک تکه از فرهنگ ایران یا جهان را باز کن؛ معنی، ریشه، و یک جزئیات غافلگیرکننده."
	},
	{
		id: "gk",
		label: "اطلاعات عمومی",
		prompt: "یک واقعیت عمومی جذاب بگو، بعد لایه‌های پشت آن را باز کن تا فقط حفظی نباشد."
	}
];
var QUIZ_TOPICS = [
	"اطلاعات عمومی",
	"علوم",
	"تاریخ ایران",
	"جغرافیای جهان",
	"فضا",
	"بدن انسان",
	"ادبیات فارسی",
	"فناوری"
];
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function uid() {
	return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
var FOLDERS = [
	{
		id: "inbox",
		code: "00",
		label: "ورودی"
	},
	{
		id: "projects",
		code: "01",
		label: "پروژه‌ها"
	},
	{
		id: "areas",
		code: "02",
		label: "حوزه‌ها"
	},
	{
		id: "resources",
		code: "03",
		label: "منابع"
	},
	{
		id: "knowledge",
		code: "04",
		label: "دانش"
	},
	{
		id: "content",
		code: "05",
		label: "محتوا"
	},
	{
		id: "people",
		code: "06",
		label: "افراد"
	},
	{
		id: "daily",
		code: "07",
		label: "یادداشت روزانه"
	},
	{
		id: "archive",
		code: "08",
		label: "آرشیو"
	}
];
var KEY = "pouya-vault-v1";
function read() {
	if (typeof window === "undefined") return [];
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}
function write(notes) {
	localStorage.setItem(KEY, JSON.stringify(notes));
}
function listNotes() {
	return read().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}
function saveNote(input) {
	const notes = read();
	const now = (/* @__PURE__ */ new Date()).toISOString();
	if (input.id) {
		const next = notes.map((n) => n.id === input.id ? {
			...n,
			title: input.title,
			body: input.body,
			folder: input.folder,
			updatedAt: now
		} : n);
		write(next);
		return next.find((n) => n.id === input.id);
	}
	const note = {
		id: uid(),
		folder: input.folder,
		title: input.title.trim() || "بدون عنوان",
		body: input.body,
		createdAt: now,
		updatedAt: now,
		source: input.source
	};
	write([note, ...notes]);
	return note;
}
function deleteNote(id) {
	write(read().filter((n) => n.id !== id));
}
function titleFromBody(body) {
	const line = body.replace(/^#+\s*/, "").split("\n").map((l) => l.trim()).find(Boolean);
	if (!line) return "یادداشت جدید";
	return line.replace(/[*`]/g, "").slice(0, 72);
}
function PouyaStage({ mood, caption, compact }) {
	const videoRef = (0, import_react.useRef)(null);
	const src = mood === "intro" ? "/pouya/intro.mp4" : "/pouya/talk.mp4";
	const loop = mood !== "intro";
	(0, import_react.useEffect)(() => {
		const el = videoRef.current;
		if (!el) return;
		el.loop = loop;
		if (el.getAttribute("src") !== src) el.src = src;
		const play = () => {
			el.play().catch(() => void 0);
		};
		play();
	}, [
		src,
		loop,
		mood
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: cn("relative overflow-hidden bg-stage", compact ? "h-[28vh] min-h-44 max-h-64 lg:h-full lg:max-h-none lg:min-h-0" : "h-[38vh] min-h-52 max-h-80 lg:h-full lg:max-h-none"),
		"aria-label": "استودیوی پویا",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("video", {
				ref: videoRef,
				className: cn("absolute inset-0 size-full object-cover object-[center_18%] transition-transform duration-slow ease-out", mood === "think" && "scale-[1.04]", mood === "talk" && "scale-[1.02]"),
				poster: "/pouya/idle.jpg",
				src,
				muted: true,
				playsInline: true,
				autoPlay: true,
				preload: "auto"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "stage-veil pointer-events-none absolute inset-0" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "felt-grain pointer-events-none absolute inset-0" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 lg:p-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: cn("max-w-[28rem] text-balance font-display text-sm font-medium text-cream/95 drop-shadow-sm sm:text-base", mood === "think" && "shimmer-text"),
					children: caption
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "hidden rounded-full border border-cream/20 bg-ink/25 px-3 py-1 text-xs text-cream/80 backdrop-blur-sm sm:inline",
					children: mood === "intro" ? "ورود" : mood === "think" ? "در حال فکر" : mood === "talk" ? "در حال گفتن" : "آماده"
				})]
			})
		]
	});
}
function inlineFormat(text) {
	return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g).map((part, i) => {
		if (part.startsWith("**") && part.endsWith("**")) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", {
			className: "font-medium text-fg",
			children: part.slice(2, -2)
		}, i);
		if (part.startsWith("*") && part.endsWith("*")) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("em", {
			className: "italic",
			children: part.slice(1, -1)
		}, i);
		if (part.startsWith("`") && part.endsWith("`")) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
			className: "rounded-xs bg-surface px-1 py-0.5 font-mono text-[0.85em]",
			children: part.slice(1, -1)
		}, i);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: part }, i);
	});
}
function RichText({ text }) {
	const blocks = text.replace(/\r/g, "").split(/\n{2,}/);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "space-y-3 text-pretty leading-normal text-fg",
		children: blocks.map((block, i) => {
			const lines = block.split("\n");
			if (lines.every((l) => /^\s*([-*]|\d+\.)\s+/.test(l))) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-1 pr-5",
				children: lines.map((l, j) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "list-disc",
					children: inlineFormat(l.replace(/^\s*([-*]|\d+\.)\s+/, ""))
				}, j))
			}, i);
			const heading = block.match(/^(#{1,3})\s+(.*)$/);
			if (heading && lines.length === 1) {
				const Tag = heading[1].length === 1 ? "h3" : "h4";
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tag, {
					className: "font-display text-base font-medium tracking-tight",
					children: inlineFormat(heading[2])
				}, i);
			}
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: lines.map((l, j) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [j > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}) : null, inlineFormat(l)] }, j)) }, i);
		})
	});
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium select-none transition-[transform,background-color,opacity,color] duration-quick ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-45 active:not-disabled:scale-[0.96]", {
	variants: {
		variant: {
			default: "bg-primary text-primary-foreground hover:bg-ink",
			cream: "bg-cream text-ink hover:bg-cream-deep",
			outline: "border border-border bg-transparent text-fg hover:bg-surface",
			ghost: "text-fg-muted hover:bg-surface hover:text-fg",
			stage: "bg-stage-deep text-cream hover:bg-ink"
		},
		size: {
			default: "h-11 min-h-11 rounded-md px-4 text-sm",
			sm: "h-9 min-h-9 rounded-sm px-3 text-sm",
			lg: "h-12 min-h-12 rounded-lg px-5 text-base",
			icon: "size-11 min-h-11 rounded-md"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function Button({ className, variant, size, asChild = false, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
function Input({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		className: cn("h-11 min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg placeholder:text-fg-subtle", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", className),
		...props
	});
}
function Textarea({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
		className: cn("min-h-11 w-full resize-none rounded-md border border-border bg-surface px-3 py-2.5 text-sm text-fg placeholder:text-fg-subtle", "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", className),
		...props
	});
}
var INTRO_KEY = "pouya-intro-seen";
function spokenSlice(text) {
	const clean = text.replace(/[#>*`]/g, "").replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
	if (clean.length <= 360) return clean;
	const cut = clean.slice(0, 360);
	const mark = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("؟"), cut.lastIndexOf("!"));
	return mark > 80 ? cut.slice(0, mark + 1) : cut;
}
function PouyaApp() {
	const [tab, setTab] = (0, import_react.useState)("chat");
	const [level, setLevel] = (0, import_react.useState)("teen");
	const [voiceOn, setVoiceOn] = (0, import_react.useState)(true);
	const [mood, setMood] = (0, import_react.useState)("intro");
	const [mode, setMode] = (0, import_react.useState)("chat");
	const [messages, setMessages] = (0, import_react.useState)([]);
	const [draft, setDraft] = (0, import_react.useState)("");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const [typed, setTyped] = (0, import_react.useState)("");
	const audioRef = (0, import_react.useRef)(null);
	const scrollerRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (sessionStorage.getItem(INTRO_KEY)) {
			setMood("idle");
			return;
		}
		const t = window.setTimeout(() => {
			sessionStorage.setItem(INTRO_KEY, "1");
			setMood("idle");
		}, 12500);
		return () => window.clearTimeout(t);
	}, []);
	(0, import_react.useEffect)(() => {
		scrollerRef.current?.scrollTo({
			top: scrollerRef.current.scrollHeight,
			behavior: "smooth"
		});
	}, [
		messages,
		typed,
		busy,
		tab
	]);
	const caption = mood === "intro" ? "سلام، من پویام." : busy ? "دارم فکر می‌کنم…" : tab === "quiz" ? "بزن بریم آزمون." : tab === "vault" ? "اینجا مغز دوم توست." : messages.length === 0 ? "چی دوست داری امروز یاد بگیری؟" : "گوش می‌دم.";
	async function playVoice(text) {
		if (!voiceOn) return;
		try {
			const res = await speakPouya({ data: { text: spokenSlice(text) } });
			if (!res.ok) return;
			audioRef.current?.pause();
			const url = `data:${res.mime};base64,${res.audio}`;
			const audio = new Audio(url);
			audioRef.current = audio;
			setMood("talk");
			audio.onended = () => setMood("idle");
			await audio.play();
		} catch {}
	}
	function typeOut(text) {
		setTyped("");
		let i = 0;
		const step = Math.max(1, Math.ceil(text.length / 180));
		return new Promise((resolve) => {
			const tick = () => {
				i = Math.min(text.length, i + step);
				setTyped(text.slice(0, i));
				if (i >= text.length) {
					resolve();
					return;
				}
				window.setTimeout(tick, 16);
			};
			tick();
		});
	}
	async function send(text, nextMode = mode) {
		const content = text.trim();
		if (!content || busy) return;
		setMode(nextMode);
		setDraft("");
		setTab("chat");
		const history = [...messages, {
			role: "user",
			content
		}];
		setMessages(history);
		setBusy(true);
		setMood("think");
		audioRef.current?.pause();
		try {
			const res = await askPouya({ data: {
				messages: history.slice(-12),
				level,
				mode: nextMode
			} });
			if (!res.ok) {
				toast.error(res.error === "AI is not available" ? "هوش مصنوعی الان در دسترس نیست." : res.error);
				setMood("idle");
				return;
			}
			setMood("talk");
			playVoice(res.text);
			await typeOut(res.text);
			setMessages([...history, {
				role: "assistant",
				content: res.text
			}]);
			setTyped("");
			setMood("idle");
		} catch {
			toast.error("ارتباط برقرار نشد. دوباره امتحان کن.");
			setMood("idle");
		} finally {
			setBusy(false);
		}
	}
	function newChat() {
		audioRef.current?.pause();
		setMessages([]);
		setTyped("");
		setMode("chat");
		setMood("idle");
	}
	function saveLast(folder = "knowledge") {
		const last = [...messages].reverse().find((m) => m.role === "assistant");
		if (!last) {
			toast.error("هنوز پاسخی برای ذخیره نیست.");
			return;
		}
		saveNote({
			folder,
			title: titleFromBody(last.content),
			body: last.content,
			source: "chat"
		});
		toast.success("در مغز دوم ذخیره شد.");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-dvh flex-col bg-background text-fg lg:h-dvh lg:flex-row",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "relative lg:w-[42%] lg:shrink-0",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PouyaStage, {
				mood,
				caption,
				compact: tab !== "chat" || messages.length > 0
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex min-h-0 min-w-0 flex-1 flex-col bg-background",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "flex items-center gap-2 border-b border-border px-3 py-2.5 sm:px-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-base font-medium tracking-tight",
							children: "پویا"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-fg-muted",
							children: "مربی زنده دانش و آموزش"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						className: "flex rounded-lg bg-surface p-1",
						"aria-label": "بخش‌ها",
						children: [
							[
								"chat",
								"گفتگو",
								MessageCircle
							],
							[
								"quiz",
								"آزمون",
								GraduationCap
							],
							[
								"vault",
								"مغز دوم",
								Brain
							]
						].map(([id, label, Icon]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setTab(id),
							className: cn("flex h-10 items-center gap-1.5 rounded-md px-2.5 text-sm transition-colors duration-quick", tab === id ? "bg-cream text-ink" : "text-fg-muted hover:text-fg"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
								className: "size-4",
								strokeWidth: 1.75
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "hidden sm:inline",
								children: label
							})]
						}, id))
					})]
				}),
				tab === "chat" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChatPane, {
					messages,
					typed,
					busy,
					draft,
					setDraft,
					level,
					setLevel,
					voiceOn,
					setVoiceOn,
					mode,
					scrollerRef,
					onSend: (t) => void send(t),
					onLesson: (t) => void send(t, "lesson"),
					onDaily: () => void send("مرور روزانه را شروع کن. از من سؤال بپرس.", "daily"),
					onFact: () => void askFact(level, send),
					onNew: newChat,
					onSave: () => saveLast()
				}) : null,
				tab === "quiz" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QuizPane, {
					level,
					setMood
				}) : null,
				tab === "vault" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VaultPane, {}) : null
			]
		})]
	});
}
async function askFact(level, send) {
	await send("یک دانستی امروز غافلگیرکننده برایم بگو.", "chat");
}
function ChatPane({ messages, typed, busy, draft, setDraft, level, setLevel, voiceOn, setVoiceOn, mode, scrollerRef, onSend, onLesson, onDaily, onFact, onNew, onSave }) {
	const empty = messages.length === 0 && !typed;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-center gap-2 border-b border-border px-3 py-2 sm:px-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex rounded-md bg-surface p-0.5",
					children: LEVELS.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						title: l.hint,
						onClick: () => setLevel(l.id),
						className: cn("h-8 rounded-sm px-2.5 text-xs transition-colors", level === l.id ? "bg-cream text-ink" : "text-fg-muted hover:text-fg"),
						children: l.label
					}, l.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "ghost",
					size: "sm",
					onClick: () => setVoiceOn(!voiceOn),
					"aria-pressed": voiceOn,
					title: voiceOn ? "قطع صدا" : "روشن کردن صدا",
					children: [voiceOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "hidden sm:inline",
						children: voiceOn ? "صدا روشن" : "بی‌صدا"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "flex-1" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: "sm",
					onClick: onNew,
					children: "گفتگوی تازه"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "ghost",
					size: "sm",
					onClick: onSave,
					disabled: !messages.some((m) => m.role === "assistant"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bookmark, { className: "size-4" }), "ذخیره"]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			ref: scrollerRef,
			className: "min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5",
			children: empty ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex max-w-xl flex-col gap-6 pt-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "font-display text-2xl font-medium tracking-tight text-balance sm:text-3xl",
						children: "آموزش زنده، نه جزوه خشک."
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 max-w-md text-sm leading-normal text-fg-muted text-pretty",
						children: "بپرس، درس کوتاه بگیر، آزمون بده، یا مرور روزانه را شروع کن. پویا جواب را برایت نگه می‌دارد."
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-2",
						children: TOPICS.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => onLesson(t.prompt),
							className: "h-10 rounded-full border border-border bg-card px-3.5 text-sm text-fg transition-colors hover:border-stage/40 hover:bg-cream",
							children: t.label
						}, t.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							size: "sm",
							onClick: onDaily,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, { className: "size-4" }), "مرور روزانه"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							size: "sm",
							onClick: onFact,
							children: "دانستی امروز"
						})]
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex max-w-xl flex-col gap-4",
				children: [
					mode !== "chat" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-fg-muted",
						children: mode === "daily" ? "حالت مرور روزانه" : "حالت درس کوتاه"
					}) : null,
					messages.map((m, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bubble, {
						role: m.role,
						text: m.content
					}, i)),
					typed ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bubble, {
						role: "assistant",
						text: typed,
						live: true
					}) : null,
					busy && !typed ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 text-sm text-fg-muted",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 animate-pulse rounded-full bg-stage" }), "پویا دارد فکر می‌کند"]
					}) : null
				]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("form", {
			className: "border-t border-border bg-background p-3 sm:px-5 sm:pb-4",
			onSubmit: (e) => {
				e.preventDefault();
				onSend(draft);
			},
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mx-auto flex max-w-xl items-end gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
					value: draft,
					rows: 1,
					onChange: (e) => setDraft(e.target.value),
					onKeyDown: (e) => {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault();
							onSend(draft);
						}
					},
					placeholder: "بپرس، یا بگو چه چیزی را می‌خواهی بفهمی…",
					className: "max-h-32 min-h-12 flex-1 rounded-lg py-3",
					disabled: busy
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					size: "icon",
					disabled: busy || !draft.trim(),
					"aria-label": "ارسال",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Send, { className: "size-4" })
				})]
			})
		})
	] });
}
function Bubble({ role, text, live }) {
	const mine = role === "user";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
		className: cn("max-w-[92%] rounded-xl px-4 py-3 text-sm leading-normal", mine ? "bg-stage text-cream" : "ms-auto border border-border bg-card text-fg", live && "opacity-95"),
		children: mine ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-pretty",
			children: text
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RichText, { text })
	});
}
function QuizPane({ level, setMood }) {
	const [topic, setTopic] = (0, import_react.useState)(QUIZ_TOPICS[0]);
	const [custom, setCustom] = (0, import_react.useState)("");
	const [quiz, setQuiz] = (0, import_react.useState)(null);
	const [index, setIndex] = (0, import_react.useState)(0);
	const [picked, setPicked] = (0, import_react.useState)(null);
	const [score, setScore] = (0, import_react.useState)(0);
	const [done, setDone] = (0, import_react.useState)(false);
	const [loading, setLoading] = (0, import_react.useState)(false);
	async function start() {
		setLoading(true);
		setMood("think");
		setQuiz(null);
		setIndex(0);
		setPicked(null);
		setScore(0);
		setDone(false);
		try {
			const res = await makeQuiz({ data: {
				topic: custom.trim() || topic,
				level
			} });
			if (!res.ok) {
				toast.error(res.error === "AI is not available" ? "هوش مصنوعی الان در دسترس نیست." : res.error);
				setMood("idle");
				return;
			}
			setQuiz(res.quiz);
			setMood("talk");
			window.setTimeout(() => setMood("idle"), 1800);
		} catch {
			toast.error("آزمون ساخته نشد.");
			setMood("idle");
		} finally {
			setLoading(false);
		}
	}
	function choose(i) {
		if (picked !== null || !quiz) return;
		setPicked(i);
		if (i === quiz.questions[index].correct) setScore((s) => s + 1);
	}
	function next() {
		if (!quiz) return;
		if (index + 1 >= quiz.questions.length) {
			setDone(true);
			const finalScore = score;
			saveNote({
				folder: "knowledge",
				title: `آزمون ${quiz.topic} — ${finalScore}/${quiz.questions.length}`,
				body: `نتیجه آزمون «${quiz.topic}»: ${finalScore} از ${quiz.questions.length}.`,
				source: "quiz"
			});
			return;
		}
		setIndex((n) => n + 1);
		setPicked(null);
	}
	if (done && quiz) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex w-full max-w-xl flex-1 flex-col justify-center gap-5 px-5 py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-fg-muted",
				children: "پایان آزمون"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
				className: "font-display text-3xl font-medium tracking-tight",
				children: [
					score,
					" از ",
					quiz.questions.length
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-fg-muted",
				children: "نتیجه در مغز دوم، پوشه دانش، ذخیره شد."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: () => setQuiz(null),
				children: "آزمون تازه"
			})
		]
	});
	if (quiz) {
		const q = quiz.questions[index];
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 overflow-y-auto px-5 py-6",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-baseline justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-fg-muted",
						children: quiz.topic
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "tabular-nums text-xs text-fg-muted",
						children: [
							index + 1,
							" / ",
							quiz.questions.length
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl font-medium tracking-tight text-balance",
					children: q.q
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex flex-col gap-2",
					children: q.options.map((opt, i) => {
						const show = picked !== null;
						const right = i === q.correct;
						const mine = i === picked;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => choose(i),
							className: cn("min-h-12 rounded-lg border px-4 py-3 text-right text-sm transition-colors", !show && "border-border bg-card hover:border-stage/40", show && right && "border-stage bg-cream text-ink", show && mine && !right && "border-border bg-surface text-fg-muted line-through", show && !mine && !right && "border-border bg-card text-fg-muted"),
							children: opt
						}, i);
					})
				}),
				picked !== null ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm leading-normal text-fg-muted text-pretty",
						children: q.why
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: next,
						children: index + 1 >= quiz.questions.length ? "نتیجه" : "سؤال بعد"
					})]
				}) : null
			]
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-5 py-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-2xl font-medium tracking-tight",
				children: "آزمون زنده"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-fg-muted",
				children: "موضوع را انتخاب کن؛ پویا پنج سؤال چهارگزینه‌ای می‌سازد."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-2",
				children: QUIZ_TOPICS.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => {
						setTopic(t);
						setCustom("");
					},
					className: cn("h-10 rounded-full border px-3.5 text-sm", topic === t && !custom ? "border-stage bg-cream text-ink" : "border-border bg-card hover:border-stage/40"),
					children: t
				}, t))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				value: custom,
				onChange: (e) => setCustom(e.target.value),
				placeholder: "یا موضوع دلخواه بنویس…"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				onClick: () => void start(),
				disabled: loading,
				children: loading ? "در حال ساخت آزمون…" : "شروع آزمون"
			})
		]
	});
}
function VaultPane() {
	const [notes, setNotes] = (0, import_react.useState)(() => typeof window === "undefined" ? [] : listNotes());
	const [folder, setFolder] = (0, import_react.useState)("all");
	const [active, setActive] = (0, import_react.useState)(null);
	const [title, setTitle] = (0, import_react.useState)("");
	const [body, setBody] = (0, import_react.useState)("");
	function refresh() {
		const all = listNotes();
		setNotes(all);
		if (active) setActive(all.find((n) => n.id === active.id) ?? null);
	}
	const visible = notes.filter((n) => folder === "all" || n.folder === folder);
	function open(note) {
		setActive(note);
		setTitle(note.title);
		setBody(note.body);
	}
	function create() {
		const note = saveNote({
			folder: folder === "all" ? "inbox" : folder,
			title: "یادداشت جدید",
			body: "",
			source: "manual"
		});
		refresh();
		open(note);
	}
	function persist() {
		if (!active) return;
		saveNote({
			id: active.id,
			folder: active.folder,
			title,
			body,
			source: active.source
		});
		refresh();
		toast.success("ذخیره شد.");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-0 flex-1 flex-col lg:flex-row",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
			className: "border-b border-border lg:w-56 lg:border-b-0 lg:border-s",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between px-3 py-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-fg-muted",
					children: "پوشه‌ها"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					size: "icon",
					className: "size-9 min-h-9",
					onClick: create,
					"aria-label": "یادداشت تازه",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" })
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-1 overflow-x-auto px-2 pb-2 lg:flex-col lg:overflow-visible",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderBtn, {
					active: folder === "all",
					onClick: () => setFolder("all"),
					label: "همه"
				}), FOLDERS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FolderBtn, {
					active: folder === f.id,
					onClick: () => setFolder(f.id),
					label: `${f.code} ${f.label}`
				}, f.id))]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex min-h-0 min-w-0 flex-1 flex-col md:flex-row",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "max-h-48 overflow-y-auto border-b border-border md:max-h-none md:w-56 md:border-b-0 md:border-s",
				children: visible.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "px-4 py-6 text-sm text-fg-muted",
					children: "این پوشه خالی است."
				}) : visible.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => open(n),
					className: cn("flex w-full flex-col gap-0.5 px-4 py-3 text-right text-sm hover:bg-surface", active?.id === n.id && "bg-cream text-ink"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "truncate font-medium",
						children: n.title
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: cn("text-xs", active?.id === n.id ? "text-ink/60" : "text-fg-subtle"),
						children: FOLDERS.find((f) => f.id === n.folder)?.label
					})]
				}) }, n.id))
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex min-h-0 flex-1 flex-col gap-3 p-4",
				children: active ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: title,
						onChange: (e) => setTitle(e.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Textarea, {
						value: body,
						onChange: (e) => setBody(e.target.value),
						className: "min-h-40 flex-1 font-body"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: persist,
							children: "ذخیره"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							onClick: () => {
								deleteNote(active.id);
								setActive(null);
								refresh();
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" }), "حذف"]
						})]
					})
				] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-1 flex-col items-start justify-center gap-3 text-sm text-fg-muted",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "یادداشتی انتخاب نشده." }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: create,
						children: "ساخت یادداشت"
					})]
				})
			})]
		})]
	});
}
function FolderBtn({ active, onClick, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		className: cn("h-9 shrink-0 rounded-md px-3 text-xs transition-colors", active ? "bg-cream text-ink" : "text-fg-muted hover:bg-surface hover:text-fg"),
		children: label
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PouyaApp, {});
}
//#endregion
export { Home as component };
