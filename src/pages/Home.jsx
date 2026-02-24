import { useState, useEffect } from "react";
import { getTrendingMovies, searchMovies } from "../api/api.js";
import { useDebounce } from "../hooks/useDebounce.js";
import SearchBar from "../components/Searchbar.jsx";
import MovieGrid from "../components/Movies.jsx";
import "../App.css";

function Home() {
  const [movies, setMovies] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");

  const [page, setPage] = useState(1);

  const [loading, setLoading] = useState(false);

  // Debounce the search query to prevent excessive API calls
  // Waits 500ms after the user stops typing before making the API call
  const debouncedSearch = useDebounce(searchQuery, 500);

  // Reset page number when search changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // Fetch movies when page or search changes
  useEffect(() => {
    async function fetchMovies() {
      setLoading(true);

      try {
        // Fetch either trending movies or search results based on the current state
        const data = debouncedSearch
          ? await searchMovies(debouncedSearch, page)
          : await getTrendingMovies(page);

        if (page === 1) {
          setMovies(data.results || []);
        } else {
          setMovies((prev) => [...prev, ...(data.results || [])]);
        }
      } catch (error) {
        console.error("Error fetching movies:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMovies();
  }, [page, debouncedSearch]);

  // Infinite Scroll Implementation
  const handleScroll = () => {
    // Check if we're near the bottom of the page (within 100px)
    if (
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.scrollHeight - 100
    ) {
      // Only load more if we're not already loading
      if (!loading) {
        setPage((prev) => prev + 1);
      }
    }
  };

  useEffect(() => {
    handleScroll();

    window.addEventListener("scroll", handleScroll);


    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading]);

  return (
    <>
      <SearchBar onSearch={setSearchQuery} />

      <MovieGrid movies={movies} />

      {loading && <p className="text-center py-6 text-white">Loading...</p>}
    </>
  );
}

export default Home;
