// netlify/functions/send-telegram.js
//
// هذا الملف يشتغل على سيرفر Netlify (مو بمتصفح الطالب)، فالتوكن يضل مخفي تماماً.
// الموقع (index.html) يرسل الطلب لهذا الملف، وهو يرسله لتليكرام بالتوكن السري.
//
// التوكن والـ Chat ID تحطهم بإعدادات Netlify (Environment variables) مو بالكود،
// عشان حتى لو حد فتح هذا الملف ما يلقى فيه شي سري.

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    return { statusCode: 500, body: JSON.stringify({ error: "إعدادات تليكرام غير مكتملة على السيرفر" }) };
  }

  try {
    const body = JSON.parse(event.body);
    const { text, photoBase64, photoMime, caption } = body;

    // حالة إرسال رسالة نصية
    if (text) {
      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: CHAT_ID, text })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.description || "Telegram error");
      return { statusCode: 200, body: JSON.stringify({ status: "sent" }) };
    }

    // حالة إرسال صورة (base64 قادمة من المتصفح)
    if (photoBase64) {
      const buffer = Buffer.from(photoBase64, "base64");
      const boundary = "----TajheezBoundary" + Date.now();

      const parts = [];
      parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${CHAT_ID}\r\n`);
      if (caption) {
        parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n${caption}\r\n`);
      }
      parts.push(`--${boundary}\r\nContent-Disposition: form-data; name="photo"; filename="image.jpg"\r\nContent-Type: ${photoMime || "image/jpeg"}\r\n\r\n`);

      const head = Buffer.from(parts.join(""), "utf-8");
      const tail = Buffer.from(`\r\n--${boundary}--\r\n`, "utf-8");
      const multipartBody = Buffer.concat([head, buffer, tail]);

      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`, {
        method: "POST",
        headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
        body: multipartBody
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.description || "Telegram photo error");
      return { statusCode: 200, body: JSON.stringify({ status: "sent" }) };
    }

    return { statusCode: 400, body: JSON.stringify({ error: "لا يوجد محتوى للإرسال" }) };

  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
