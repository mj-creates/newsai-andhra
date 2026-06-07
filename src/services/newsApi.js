import { API_BASE_URL } from "../config";

export const fetchNewsByRegion = async (district) => {
  try {
    const response = await fetch(`${API_BASE_URL}/news/${district}`);
    const data = await response.json();
    return data.articles;
  } catch (error) {
    console.error("Error fetching news:", error);
    throw error;
  }
};