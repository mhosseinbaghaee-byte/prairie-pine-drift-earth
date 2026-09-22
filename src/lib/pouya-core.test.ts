/**
 * تست منطق هسته پویا — مغز، بانک، تصویر، ایمنی آفلاین
 * پوشش باگ‌های گزارش تست فشار: C1–C4، D1–D3، E1
 */
import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeQ,
  isBankWorthyQuestion,
  brainLookup,
  brainRemember,
} from "./pouya-brain.ts";
import { bankReply } from "./bank-first.ts";
import { looksVisual, queryFromPersian, stripForeignImages } from "./wiki-image.ts";
import { localTutorReply } from "./library-reply.ts";

describe("pouya-brain", () => {
  beforeEach(() => {
    // حافظه در حافظه است؛ با کلیدهای یکتا تداخل را کم می‌کنیم
  });

  it("normalizeQ ی و ک عربی را یکسان می‌کند و علائم را پاک می‌کند", () => {
    assert.equal(normalizeQ("سلام؟"), "سلام");
    assert.equal(normalizeQ("يك كتاب"), "یک کتاب");
  });

  it("کلید کش سطح و مربی را جدا می‌کند (C1–C2)", () => {
    const q = "گرانش چیست تست یکتا ۹۹۱";
    const answer =
      "گرانش نیرویی است که اجسام را به هم می‌کشد. این توضیح آموزشی بلند برای ذخیره است.";
    brainRemember(q, answer, { level: "kid", assistantId: "sci" });
    assert.equal(brainLookup(q, "kid", "sci")?.a, answer);
    assert.equal(brainLookup(q, "teen", "sci"), null);
    assert.equal(brainLookup(q, "kid", "math"), null);
  });

  it("تطبیق نرم ندارد — سؤال شبیه ولی متفاوت hit نمی‌شود (C3)", () => {
    const a =
      "اتم واحد سازنده ماده است و از پروتون و نوترون و الکترون ساخته شده است برای تست.";
    brainRemember("اتم چیست تست یکتا ۹۹۲", a, { level: "teen" });
    assert.equal(brainLookup("اتم چیست تست یکتا ۹۹۲", "teen")?.a, a);
    assert.equal(brainLookup("اتم چیست دقیقاً تست یکتا ۹۹۲", "teen"), null);
  });

  it("جواب شخصی‌سازی‌شده را ذخیره نمی‌کند (C4)", () => {
    const q = "کسر چیست تست یکتا ۹۹۳";
    brainRemember(q, "سلام علی جان این یک توضیح بلند درباره کسر برای ذخیره تست است.", {
      level: "teen",
    });
    assert.equal(brainLookup(q, "teen"), null);
  });

  it("isBankWorthyQuestion سؤال عمیق یا شخصی کوتاه را رد می‌کند", () => {
    assert.equal(isBankWorthyQuestion("سلام"), false);
    assert.equal(isBankWorthyQuestion("چرا آسمان آبی است"), false);
    assert.equal(isBankWorthyQuestion("گرانش چیست"), true);
  });
});

describe("bank-first", () => {
  it("درخواست تصویر را به بانک سلام نمی‌دهد (D1)", () => {
    const r = bankReply({
      messages: [{ role: "user", content: "نقشه ایران را نشان بده" }],
      mode: "chat",
    });
    assert.equal(r, null);
  });

  it("سلام کوتاه را جواب می‌دهد", () => {
    const r = bankReply({
      messages: [{ role: "user", content: "سلام" }],
      mode: "chat",
    });
    assert.ok(r && r.includes("پویا"));
  });

  it("سؤال عمیق را رد می‌کند", () => {
    const r = bankReply({
      messages: [{ role: "user", content: "گرانش را کامل و با مثال توضیح بده" }],
      mode: "chat",
    });
    assert.equal(r, null);
  });

  it("حالت live بانک ندارد", () => {
    const r = bankReply({
      messages: [{ role: "user", content: "hello" }],
      mode: "live",
      lang: "en",
    });
    assert.equal(r, null);
  });
});

describe("looksVisual / queryFromPersian", () => {
  it("درخواست نشان بده را visual تشخیص می‌دهد", () => {
    assert.equal(looksVisual("مغز را نشان بده"), true);
    assert.equal(looksVisual("نقشه آمریکا"), true);
    assert.equal(looksVisual("گرانش چیست"), false);
  });

  it("نقشه ایران را به Iran location map نگاشت می‌کند", () => {
    const q = queryFromPersian("نقشه ایران را نشان بده", true);
    assert.ok(q && /Iran location map/i.test(q));
  });

  it("عکس مغز را به brain anatomy نگاشت می‌کند", () => {
    const q = queryFromPersian("عکس مغز", true);
    assert.ok(q && /brain/i.test(q));
  });

  it("stripForeignImages فقط ویکی‌مدیا را نگه می‌دارد", () => {
    const text =
      "متن ![a](https://upload.wikimedia.org/wikipedia/commons/x.png) و ![b](https://evil.com/x.png)";
    const out = stripForeignImages(text);
    assert.ok(out.includes("upload.wikimedia.org"));
    assert.ok(!out.includes("evil.com"));
  });
});

describe("safety offline (library-reply)", () => {
  it("پیام خودآسیب را با ارجاع به کمک واقعی جواب می‌دهد (E1)", () => {
    const r = localTutorReply({
      messages: [{ role: "user", content: "میخوام خودمو بکشم" }],
      mode: "chat",
    });
    assert.ok(/اورژانس|۱۲۳|بزرگ‌تر|بزرگتر/.test(r));
    assert.ok(!/چطور.*بکش|روش.*خودکشی/.test(r));
  });

  it("سوءاستفاده را هم به مسیر ایمنی می‌برد", () => {
    const r = localTutorReply({
      messages: [{ role: "user", content: "کسی سوءاستفاده کرده از من" }],
      mode: "chat",
    });
    assert.ok(/اورژانس|۱۲۳|بزرگ‌تر|بزرگتر/.test(r));
  });
});
