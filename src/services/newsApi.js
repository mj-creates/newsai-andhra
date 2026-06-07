export const fetchNewsByRegion = async (district) => {
  try {
    const response = await fetch(`http://localhost:5000/news/${district}`);
    const data = await response.json();
    return data.articles;
  } catch (error) {
    console.error("Error fetching news:", error);
    throw error;
  }
};