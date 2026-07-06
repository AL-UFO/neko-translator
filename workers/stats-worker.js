export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // Log translation request
    if (url.pathname === "/api/log" && request.method === "POST") {
      const db = env.DB;

      if (!db) {
        return Response.json(
          { error: "Database not available" },
          { status: 503, headers: corsHeaders },
        );
      }

      try {
        const body = await request.json();
        const { mode, level, isDemo, clientId, ip } = body;

        await db
          .prepare(
            "INSERT INTO translate_logs (mode, level, is_demo, client_id, ip) VALUES (?, ?, ?, ?, ?)",
          )
          .bind(mode, level, isDemo ? 1 : 0, clientId, ip)
          .run();

        return Response.json(
          { success: true },
          { headers: corsHeaders },
        );
      } catch (error) {
        console.error("Log error:", error);
        return Response.json(
          { error: "Failed to log request" },
          { status: 500, headers: corsHeaders },
        );
      }
    }

    // Get stats
    if (url.pathname === "/api/stats" && request.method === "GET") {
      const db = env.DB;

      if (!db) {
        return Response.json(
          { error: "Database not available" },
          { status: 503, headers: corsHeaders },
        );
      }

      try {
        // Total requests
        const total = await db
          .prepare("SELECT COUNT(*) as count FROM translate_logs")
          .first();

        // Today's requests
        const today = await db
          .prepare(
            "SELECT COUNT(*) as count FROM translate_logs WHERE date(created_at) = date('now')",
          )
          .first();

        // Requests by mode
        const byMode = await db
          .prepare(
            "SELECT mode, COUNT(*) as count FROM translate_logs GROUP BY mode ORDER BY count DESC",
          )
          .all();

        // Requests by level
        const byLevel = await db
          .prepare(
            "SELECT level, COUNT(*) as count FROM translate_logs GROUP BY level ORDER BY count DESC",
          )
          .all();

        // Demo vs real requests
        const demoStats = await db
          .prepare(
            "SELECT is_demo, COUNT(*) as count FROM translate_logs GROUP BY is_demo",
          )
          .all();

        // Unique clients (by client_id)
        const uniqueClients = await db
          .prepare(
            "SELECT COUNT(DISTINCT client_id) as count FROM translate_logs",
          )
          .first();

        // Requests in last 7 days
        const last7Days = await db
          .prepare(
            "SELECT date(created_at) as date, COUNT(*) as count FROM translate_logs WHERE created_at >= datetime('now', '-7 days') GROUP BY date(created_at) ORDER BY date DESC",
          )
          .all();

        return Response.json(
          {
            total: total?.count || 0,
            today: today?.count || 0,
            uniqueClients: uniqueClients?.count || 0,
            byMode: byMode?.results || [],
            byLevel: byLevel?.results || [],
            demoStats: demoStats?.results || [],
            last7Days: last7Days?.results || [],
          },
          { headers: corsHeaders },
        );
      } catch (error) {
        console.error("Stats query error:", error);
        return Response.json(
          { error: "Failed to fetch stats" },
          { status: 500, headers: corsHeaders },
        );
      }
    }

    return Response.json(
      { error: "Not found" },
      { status: 404, headers: corsHeaders },
    );
  },
};
