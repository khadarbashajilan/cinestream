const BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

async function fetchFromTMDB(endpoint, params = {}) {
  if (!API_KEY) {
    throw new Error("key is missing");
  }

  const queryParams = new URLSearchParams({
    api_key: API_KEY,
    ...params,
  }).toString();

  const url = `${BASE_URL}${endpoint}?${queryParams}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error("API Error:", error.message);
    throw  new Error(error.message);
  }
}

export async function getTrendingMovies(page = 1) {
  return fetchFromTMDB("/trending/movie/week", { page });
}

export async function searchMovies(query, page = 1) {
  return fetchFromTMDB("/search/movie", { query, page });
}
