import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
import { a as object, n as array, o as string, t as _enum } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/ai-C4ZA3CBs.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
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
function levelLine(level) {
	if (level === "kid") return "سطح: خیلی ساده، تصویری، جمله‌های کوتاه. مثل توضیح برای یک کودک کنجکاو.";
	if (level === "teen") return "سطح: دبیرستان. دقیق، با مثال، بدون ساده‌سازی غلط.";
	return "سطح: عمیق. nuance، سازوکار، و محدودیت ادعا را بگو.";
}
function systemPrompt(level, mode) {
	const base = `تو «پویا» هستی: مربی نمدی زنده برای آموزش و اطلاعات عمومی.
شخصیت: گرم، کنجکاو، کمی شوخ، صمیمی — مثل یک معلم استاپ‌موشن روی صحنه قرمز، نه یک ربات خشک.
قوانین سخت:
- به زبان کاربر جواب بده. اگر فارسی نوشت، فارسی روان و طبیعی بنویس.
- ${levelLine(level)}
- اول اصل مطلب را روشن بگو، بعد در صورت نیاز عمیق‌تر شو.
- از تشبیه ملموس استفاده کن.
- واقعیت ساختگی نساز. اگر مطمئن نیستی، صریح بگو.
- لحن گفتاری و زنده. از ایموجی استفاده نکن.
- پاراگراف‌های کوتاه. در صورت نیاز لیست.
- پاسخ را بین ۱۸۰ تا ۷۰۰ کلمه نگه دار مگر اینکه کاربر خلاصه بخواهد.`;
	if (mode === "daily") return `${base}

حالت مرور روزانه / مغز دوم:
مثل یک مصاحبه‌گر شخصی باش. هر نوبت ۳ تا ۵ سؤال کوتاه بپرس — نه بیشتر.
موضوع سؤال‌ها: کار امروز، پیشرفت، تصمیم، یادگیری، ایده، افراد، پیگیری، تمرکز بعدی.
اگر جواب کلی بود یک follow-up مفید بپرس.
وقتی اطلاعات کافی شد، یک یادداشت روزانه ساخت‌یافته پیشنهاد بده با عنوان‌های:
کارهای امروز / پیشرفت‌ها / تصمیمات / ایده‌ها / یادگیری‌ها / پیگیری‌ها / تمرکز بعدی
فقط بخش‌هایی را بنویس که محتوا دارند. اطلاعات را از حرف‌های کاربر بساز، چیزی اختراع نکن.
در پایان بپرس کدام بخش را در مغز دوم ذخیره کند.`;
	if (mode === "lesson") return `${base}

حالت درس کوتاه:
ساختار ثابت:
1) عنوان یک خطی
2) ایده اصلی در دو جمله
3) سه بخش کوتاه با زیرعنوان
4) یک مثال ملموس
5) یک سؤال پایانی برای فکر کردن
زنده و پویا بنویس، نه جزوه.`;
	return `${base}

حالت گفتگو:
اگر سؤال باز است، یک پاسخ کامل بده و در آخر یک سؤال کوتاه بپرس تا گفتگو ادامه پیدا کند.
اگر کاربر خواست آزمون یا درس، همان را بده.`;
}
async function grokChat(messages, maxTokens) {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "AI is not available"
	};
	const res = await fetch("https://api.x.ai/v1/chat/completions", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			model: "grok-4.5",
			messages,
			max_tokens: maxTokens,
			temperature: .7
		})
	});
	if (!res.ok) return {
		ok: false,
		error: `xAI API error ${res.status}`
	};
	const text = (await res.json()).choices?.[0]?.message?.content?.trim() ?? "";
	if (!text) return {
		ok: false,
		error: "پاسخ خالی آمد"
	};
	return {
		ok: true,
		text
	};
}
var askPouya_createServerFn_handler = createServerRpc({
	id: "43edcad30e7fee0c4d47e311d235a376d258312d6d9f27586d1c3cefefdfb059",
	name: "askPouya",
	filename: "src/lib/ai.ts"
}, (opts) => askPouya.__executeServer(opts));
var askPouya = createServerFn({ method: "POST" }).validator((input) => ChatInput.parse(input)).handler(askPouya_createServerFn_handler, async ({ data }) => {
	return grokChat([{
		role: "system",
		content: systemPrompt(data.level, data.mode)
	}, ...data.messages], data.mode === "lesson" ? 900 : 800);
});
var makeQuiz_createServerFn_handler = createServerRpc({
	id: "7706dc834ca3dea6541d1a8bf1cdb60a4caadbec4d7072d30b42ffde98d0f7ab",
	name: "makeQuiz",
	filename: "src/lib/ai.ts"
}, (opts) => makeQuiz.__executeServer(opts));
var makeQuiz = createServerFn({ method: "POST" }).validator((input) => QuizInput.parse(input)).handler(makeQuiz_createServerFn_handler, async ({ data }) => {
	const result = await grokChat([{
		role: "system",
		content: `تو طراح آزمون آموزشی هستی. فقط JSON معتبر برگردان، بدون markdown و بدون توضیح اضافه.
شکل دقیق:
{"topic":"string","questions":[{"q":"string","options":["a","b","c","d"],"correct":0,"why":"string"}]}
قوانین:
- دقیقاً ۵ سؤال چهارگزینه‌ای
- correct ایندکس ۰ تا ۳ است
- گزینه‌ها کوتاه و متمایز
- why یک توضیح ۲ تا ۳ جمله‌ای درست و آموزنده
- زبان فارسی روان
- ${levelLine(data.level)}
- واقعیت ساختگی نساز`
	}, {
		role: "user",
		content: `آزمون اطلاعات عمومی / آموزشی درباره: ${data.topic}`
	}], 1200);
	if (!result.ok) return result;
	const jsonText = result.text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
	try {
		const parsed = JSON.parse(jsonText);
		if (!Array.isArray(parsed.questions) || parsed.questions.length < 4) return {
			ok: false,
			error: "آزمون ناقص برگشت"
		};
		const questions = parsed.questions.slice(0, 5).map((q) => ({
			q: String(q.q ?? ""),
			options: (q.options ?? []).slice(0, 4).map(String),
			correct: Math.min(3, Math.max(0, Number(q.correct) || 0)),
			why: String(q.why ?? "")
		}));
		if (questions.some((q) => !q.q || q.options.length !== 4)) return {
			ok: false,
			error: "ساختار آزمون نامعتبر است"
		};
		return {
			ok: true,
			quiz: {
				topic: parsed.topic || data.topic,
				questions
			}
		};
	} catch {
		return {
			ok: false,
			error: "نتوانستم آزمون را بخوانم"
		};
	}
});
var dailyFact_createServerFn_handler = createServerRpc({
	id: "37ca95f500f98676e12fa6cba9976368fda36e5493ec0fa5816fc955f69e147b",
	name: "dailyFact",
	filename: "src/lib/ai.ts"
}, (opts) => dailyFact.__executeServer(opts));
var dailyFact = createServerFn({ method: "POST" }).validator((input) => FactInput.parse(input)).handler(dailyFact_createServerFn_handler, async ({ data }) => {
	return grokChat([{
		role: "system",
		content: `تو پویا هستی. یک «دانستی امروز» کوتاه، زنده و دقیق بنویس.
ساختار: عنوان یک خطی، بعد ۳ تا ۵ جمله، بعد یک جمله «چرا مهم است».
فارسی روان. بدون ایموجی. ${levelLine(data.level)} واقعیت ساختگی نساز.`
	}, {
		role: "user",
		content: "دانستی امروز را بگو؛ موضوع را خودت انتخاب کن، غافلگیرکننده باشد."
	}], 400);
});
var speakPouya_createServerFn_handler = createServerRpc({
	id: "219e45791ab663a67c9f72d785c784ba88f10bbae8fec56e7c2cebeaab631fcb",
	name: "speakPouya",
	filename: "src/lib/ai.ts"
}, (opts) => speakPouya.__executeServer(opts));
var speakPouya = createServerFn({ method: "POST" }).validator((input) => SpeakInput.parse(input)).handler(speakPouya_createServerFn_handler, async ({ data }) => {
	const apiKey = process.env.XAI_API_KEY;
	if (!apiKey) return {
		ok: false,
		error: "AI is not available"
	};
	const text = data.text.replace(/[*_`#>-]/g, " ").replace(/\s+/g, " ").trim().slice(0, 420);
	const res = await fetch("https://api.x.ai/v1/tts", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`
		},
		body: JSON.stringify({
			text,
			voice_id: "zagan",
			language: "auto",
			output_format: {
				codec: "mp3",
				sample_rate: 24e3,
				bit_rate: 96e3
			},
			speed: 1
		})
	});
	if (!res.ok) return {
		ok: false,
		error: `tts ${res.status}`
	};
	return {
		ok: true,
		audio: Buffer.from(await res.arrayBuffer()).toString("base64"),
		mime: "audio/mpeg"
	};
});
//#endregion
export { askPouya_createServerFn_handler, dailyFact_createServerFn_handler, makeQuiz_createServerFn_handler, speakPouya_createServerFn_handler };
