import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON info for Box Office
  app.get("/api/boxoffice", async (req, res) => {
    try {
      const { targetDt } = req.query;
      const key = process.env.KOFIC_API_KEY || "2a350cfbca6c428eb04c71e21cc681e7";
      
      const response = await fetch(
        `http://kobis.or.kr/kobisopenapi/webservice/rest/boxoffice/searchDailyBoxOfficeList.json?key=${key}&targetDt=${targetDt}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch from KOFIC API. Status: ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Box office API error:", error);
      res.status(500).json({ error: "Failed to fetch box office data" });
    }
  });

  // JSON info for Movie details
  app.get("/api/movie/:movieCd", async (req, res) => {
    try {
      const { movieCd } = req.params;
      const key = process.env.KOFIC_API_KEY || "2a350cfbca6c428eb04c71e21cc681e7";
      
      const response = await fetch(
        `http://www.kobis.or.kr/kobisopenapi/webservice/rest/movie/searchMovieInfo.json?key=${key}&movieCd=${movieCd}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch from KOFIC API. Status: ${response.status}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      console.error("Movie detail API error:", error);
      res.status(500).json({ error: "Failed to fetch movie info" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
