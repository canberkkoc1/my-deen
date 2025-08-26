// supabase/functions/send-prayer-notifications/index.ts
import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!
  );

  // 1. Bildirimi gönderilmemiş kayıtları al
  const { data: notifications, error } = await supabase
    .from("scheduled_notifications")
    .select("*")
    .eq("sent", false)
    .lte("send_at", new Date().toISOString());

  if (error || !notifications || notifications.length === 0) {
    return new Response("No notifications to send", { status: 200 });
  }

  const messages = notifications.map((n) => ({
    to: n.token,
    sound: "default",
    title: n.title,
    body: n.body,
  }));

  // 2. Expo Push API ile gönder
  const expoRes = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(messages),
  });

  const result = await expoRes.json();

  // 3. Bildirimlerin sent = true olarak güncellenmesi
  for (const n of notifications) {
    await supabase
      .from("scheduled_notifications")
      .update({ sent: true, sent_at: new Date().toISOString() })
      .eq("id", n.id);
  }

  return new Response(JSON.stringify({ sent: messages.length, result }), {
    headers: { "Content-Type": "application/json" },
    status: 200,
  });
});
