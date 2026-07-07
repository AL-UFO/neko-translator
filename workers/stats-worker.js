export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS headers - stats page needs to read from browser
    const statsCorsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Log endpoint - no browser CORS needed, secured by token
    const logCorsHeaders = {
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, x-stats-token",
    };

    if (request.method === "OPTIONS") {
      const headers = url.pathname === "/api/log" ? logCorsHeaders : statsCorsHeaders;
      return new Response(null, { headers });
    }

    // Log translation request
    if (url.pathname === "/api/log" && request.method === "POST") {
      // Token validation
      const expectedToken = env.STATS_WRITE_TOKEN;
      const providedToken = request.headers.get("x-stats-token");

      if (!expectedToken) {
        return Response.json(
          { error: "Stats write token not configured" },
          { status: 503, headers: logCorsHeaders },
        );
      }

      if (providedToken !== expectedToken) {
        return Response.json(
          { error: "Unauthorized" },
          { status: 401, headers: logCorsHeaders },
        );
      }

      const db = env.DB;

      if (!db) {
        return Response.json(
          { error: "Database not available" },
          { status: 503, headers: logCorsHeaders },
        );
      }

      try {
        const body = await request.json();
        const { mode, level, isDemo, clientId, ip } = body;

        // Field validation
        const validModes = new Set(["soft", "tsundere", "cool", "energetic"]);
        const validLevels = new Set(["short", "medium", "long"]);

        const safeMode = validModes.has(mode) ? mode : "soft";
        const safeLevel = validLevels.has(level) ? level : "medium";
        const safeIsDemo = typeof isDemo === "boolean" ? isDemo : true;
        const safeClientId =
          typeof clientId === "string" && clientId.length > 0 && clientId.length <= 100
            ? clientId
            : "anonymous";
        const safeIp =
          typeof ip === "string" && ip.length <= 64
            ? ip
            : "unknown";

        await db
          .prepare(
            "INSERT INTO translate_logs (mode, level, is_demo, client_id, ip) VALUES (?, ?, ?, ?, ?)",
          )
          .bind(safeMode, safeLevel, safeIsDemo ? 1 : 0, safeClientId, safeIp)
          .run();

        return Response.json(
          { success: true },
          { headers: logCorsHeaders },
        );
      } catch (error) {
        console.error("Log error:", error);
        return Response.json(
          { error: "Failed to log request" },
          { status: 500, headers: logCorsHeaders },
        );
      }
    }

    // Get stats
    if (url.pathname === "/api/stats" && request.method === "GET") {
      const db = env.DB;

      if (!db) {
        return Response.json(
          { error: "Database not available" },
          { status: 503, headers: statsCorsHeaders },
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
          { headers: statsCorsHeaders },
        );
      } catch (error) {
        console.error("Stats query error:", error);
        return Response.json(
          { error: "Failed to fetch stats" },
          { status: 500, headers: statsCorsHeaders },
        );
      }
    }

    return Response.json(
      { error: "Not found" },
      { status: 404, headers: statsCorsHeaders },
    );
  },
};
