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
        const { mode, level, isDemo, clientId, ip, type } = body;

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
        const safeType = type === "taffy" ? "taffy" : "neko";

        await db
          .prepare(
            "INSERT INTO translate_logs (mode, level, is_demo, client_id, ip, type) VALUES (?, ?, ?, ?, ?, ?)",
          )
          .bind(safeMode, safeLevel, safeIsDemo ? 1 : 0, safeClientId, safeIp, safeType)
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
        // Helper to query stats for a given type
        async function queryStats(logType) {
          const where = "WHERE type = ?";

          const total = await db
            .prepare(`SELECT COUNT(*) as count FROM translate_logs ${where}`)
            .bind(logType)
            .first();

          const today = await db
            .prepare(`SELECT COUNT(*) as count FROM translate_logs ${where} AND date(created_at) = date('now')`)
            .bind(logType)
            .first();

          const byMode = await db
            .prepare(`SELECT mode, COUNT(*) as count FROM translate_logs ${where} GROUP BY mode ORDER BY count DESC`)
            .bind(logType)
            .all();

          const byLevel = await db
            .prepare(`SELECT level, COUNT(*) as count FROM translate_logs ${where} GROUP BY level ORDER BY count DESC`)
            .bind(logType)
            .all();

          const demoStats = await db
            .prepare(`SELECT is_demo, COUNT(*) as count FROM translate_logs ${where} GROUP BY is_demo`)
            .bind(logType)
            .all();

          const uniqueClients = await db
            .prepare(`SELECT COUNT(DISTINCT client_id) as count FROM translate_logs ${where}`)
            .bind(logType)
            .first();

          const last7Days = await db
            .prepare(`SELECT date(created_at) as date, COUNT(*) as count FROM translate_logs ${where} AND created_at >= datetime('now', '-7 days') GROUP BY date(created_at) ORDER BY date DESC`)
            .bind(logType)
            .all();

          return {
            total: total?.count || 0,
            today: today?.count || 0,
            uniqueClients: uniqueClients?.count || 0,
            byMode: byMode?.results || [],
            byLevel: byLevel?.results || [],
            demoStats: demoStats?.results || [],
            last7Days: last7Days?.results || [],
          };
        }

        const neko = await queryStats("neko");
        const taffy = await queryStats("taffy");

        return Response.json(
          { neko, taffy },
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
