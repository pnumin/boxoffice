import express from "express";
import { GoogleGenAI } from "@google/genai";

const app = express();

app.use(express.json());

// JSON info for Box Office
app.get("/api/boxoffice", async (req, res) => {
  try {
    const { targetDt } = req.query;
    const key = process.env.KOFIC_API_KEY || "2a350cfbca6c428eb04c71e21cc681e7";
    
    // We should use https where possible if vercel blocks http
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
    
    // We should use https where possible if vercel blocks http
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

// API for generating a movie review via Gemini
app.post("/api/generate-review", async (req, res) => {
  try {
    const { movieName, keyword1, keyword2, keyword3 } = req.body;
    const key = process.env.GEMINI_API_KEY;
    
    if (!key) {
      return res.status(500).json({ error: "Gemini API key is not configured." });
    }

    const ai = new GoogleGenAI({ 
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    const prompt = `당신은 영화 평론가입니다. 다음 영화에 대한 감상평을 작성해주세요.\n\n영화 제목: ${movieName}\n필수 포함 키워드 3가지: 1) ${keyword1}, 2) ${keyword2}, 3) ${keyword3}\n\n위 3가지 키워드가 자연스럽게 들어가도록 영화 감상평을 3~5문단 정도로 정성스럽게 작성해주세요.`;
    
    // Usually on vercel they run older node but fetch is available, also @google/genai module works.
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt
    });

    res.json({ review: response.text });
  } catch (error: any) {
    console.error("Gemini API error:", error);
    let errorMessage = "감상평 생성 중 오류가 발생했습니다.";
    if (error.message) {
      if (error.message.includes("leaked")) {
        errorMessage = "입력하신 Gemini API 키가 유출되어 사용이 차단되었습니다. AI Studio 좌측/상단 메뉴의 Settings(⚙️) > Secrets 에서 새로운 API 키로 교체해주세요.";
      } else if (error.message.includes("API key not valid") || error.message.includes("API_KEY_INVALID")) {
        errorMessage = "Gemini API 키가 유효하지 않습니다. Settings > Secrets 메뉴에서 올바른 API 키를 설정해주세요.";
      } else {
        errorMessage = error.message;
      }
    }
    res.status(500).json({ error: errorMessage });
  }
});

export default app;
