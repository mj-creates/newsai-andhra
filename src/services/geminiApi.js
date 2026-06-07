const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

/**
 * Summarizes a list of district articles in batch.
 * Returns an overall district summary (in English & Telugu) AND
 * a list of structured article cards, each with a category tag, title, and bullet points.
 */
export const summarizeNews = async (articles, district) => {
  try {
    // Take up to 5 articles for detailed summary to avoid overloading prompt
    const articlesToSummarize = articles.slice(0, 5);
    const articlesInput = articlesToSummarize.map((a, i) => {
      return `Article ${i + 1}:\nTitle: ${a.title}\nSource: ${a.source?.name || a.source || "Local News"}\nDescription: ${a.description}\nLink: ${a.url}\n`;
    }).join("\n---\n");

    const systemPrompt = `You are a regional news editor for Andhra Pradesh, India.
You must analyze the provided articles and return a JSON object with EXACTLY the following structure:
{
  "districtSummary": {
    "english": [
      "Bullet point 1 summarizing the overall situation in the district.",
      "Bullet point 2 summarizing another key update in the district.",
      "Bullet point 3 summarizing key regional news."
    ],
    "telugu": [
      "తెలుగులో మొదటి ముఖ్యమైన వార్త సారాంశం.",
      "తెలుగులో రెండవ ముఖ్యమైన వార్త సారాంశం.",
      "తెలుగులో మూడవ ముఖ్యమైన వార్త సారాంశం."
    ]
  },
  "summarizedArticles": [
    {
      "title": "Clean, authoritative headline of Article 1",
      "category": "One-word category tag (e.g., Politics, Finance, Tech, Infrastructure, Crime, Health, Agriculture)",
      "summary": [
        "Concise summary bullet point 1",
        "Concise summary bullet point 2",
        "Concise summary bullet point 3"
      ],
      "source": "Source Name (e.g. Eenadu)",
      "url": "Original article URL"
    }
  ]
}

Ensure the summarizedArticles array contains an item for each article provided (up to 5). Keep summaries crisp, scannable, and extremely readable.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Please summarize these articles from ${district} district, Andhra Pradesh:\n\n${articlesInput}`,
          },
        ],
        max_tokens: 1000,
        temperature: 0.4,
      }),
    });

    const data = await response.json();
    if (!data.choices || data.choices.length === 0) {
      throw new Error("No response from Groq");
    }

    let content = data.choices[0].message.content.trim();
    // Strip markdown code blocks if the model returned them
    if (content.startsWith("```json")) {
      content = content.substring(7, content.length - 3).trim();
    } else if (content.startsWith("```")) {
      content = content.substring(3, content.length - 3).trim();
    }

    const result = JSON.parse(content);
    
    // Normalize properties in case of minor LLM schema variances
    const rawArticlesList = result.summarizedArticles || result.articles || result.news || [];
    const districtSummaryObj = result.districtSummary || { english: [], telugu: [] };
    const finalArticles = Array.isArray(rawArticlesList) ? rawArticlesList : [];

    const mappedArticles = finalArticles.map((sArt, index) => {
      const originalArt = articlesToSummarize[index];
      return {
        title: sArt.title || originalArt?.title || "News Update",
        category: sArt.category || "General",
        summary: Array.isArray(sArt.summary) 
          ? sArt.summary 
          : [sArt.summary || sArt.description || "Read original source for details."],
        url: originalArt ? originalArt.url : (sArt.url || ""),
        source: originalArt 
          ? (originalArt.source?.name || originalArt.source) 
          : (sArt.source || "Local News"),
        publishedAt: originalArt ? originalArt.publishedAt : new Date().toISOString()
      };
    });

    return {
      districtSummary: {
        english: Array.isArray(districtSummaryObj.english) 
          ? districtSummaryObj.english 
          : [districtSummaryObj.english || ""],
        telugu: Array.isArray(districtSummaryObj.telugu) 
          ? districtSummaryObj.telugu 
          : [districtSummaryObj.telugu || ""]
      },
      summarizedArticles: mappedArticles
    };
  } catch (error) {
    console.error("Groq batch summarization error:", error);
    throw error;
  }
};

/**
 * Summarizes custom news text or text extracted from a link.
 * Returns a single summarized article object.
 */
export const summarizeCustomArticle = async (content, sourceUrl = "") => {
  try {
    const systemPrompt = `You are an expert news editor. Analyze the provided text and extract:
1. An authoritative, bold headline.
2. A single category tag (e.g., Tech, Finance, Politics, Health, Science, World, General).
3. A summary formatted as an array of 3-5 crisp, scannable bullet points (strings).

Return a JSON object with exactly these keys: "title", "category", "summary".`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Analyze and summarize this content:\n\n${content}`,
          },
        ],
        max_tokens: 600,
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    if (!data.choices || data.choices.length === 0) {
      throw new Error("No response from Groq");
    }

    let textContent = data.choices[0].message.content.trim();
    if (textContent.startsWith("```json")) {
      textContent = textContent.substring(7, textContent.length - 3).trim();
    } else if (textContent.startsWith("```")) {
      textContent = textContent.substring(3, textContent.length - 3).trim();
    }

    const result = JSON.parse(textContent);
    return {
      title: result.title || "Custom Summary",
      category: result.category || "General",
      summary: Array.isArray(result.summary) ? result.summary : [result.summary || ""],
      source: sourceUrl ? new URL(sourceUrl).hostname.replace("www.", "") : "Custom Input",
      url: sourceUrl,
      publishedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("Groq custom article summary error:", error);
    throw error;
  }
};