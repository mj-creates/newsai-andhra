import { API_BASE_URL } from "../config";

/**
 * Summarizes a list of district articles in batch via backend API.
 * Returns an overall district summary (in English & Telugu) AND
 * a list of structured article cards, each with a category tag, title, and bullet points.
 */
export const summarizeNews = async (articles, district) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/summarize-news`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ articles, district }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to summarize news");
    }
    return data;
  } catch (error) {
    console.error("Groq batch summarization error:", error);
    throw error;
  }
};

/**
 * Summarizes custom news text or text extracted from a link via backend API.
 * Returns a single summarized article object.
 */
export const summarizeCustomArticle = async (content, sourceUrl = "") => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/summarize-custom`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content, sourceUrl }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to generate AI summary");
    }
    return data;
  } catch (error) {
    console.error("Groq custom article summary error:", error);
    throw error;
  }
};