/**
 * Home Page Component
 *
 * The main page of the application that displays trending movies and search results.
 * Implements infinite scrolling for both trending movies and search results.
 *
 * Features:
 * - Displays trending movies by default
 * - Search functionality with debouncing
 * - Infinite scrolling for loading more content
 * - Loading state indicators
 *
 * @component
 * @returns {JSX.Element} The home page with movie grid and search functionality
 */
import { useState, useEffect } from "react";
import { getTrendingMovies, searchMovies } from "../api/api.js";
import { useDebounce } from "../hooks/useDebounce.js";
import SearchBar from "../components/Searchbar.jsx";
import MovieGrid from "../components/Movies.jsx";
import "../App.css";

function Home() {
  // State for storing the movies to display
  const [movies, setMovies] = useState([]);

  // State for the current search query
  const [searchQuery, setSearchQuery] = useState("");

  // State for tracking the current page number for infinite scrolling
  const [page, setPage] = useState(1);

  // State for tracking loading status
  const [loading, setLoading] = useState(false);

  // Debounce the search query to prevent excessive API calls
  // Waits 500ms after the user stops typing before making the API call
  const debouncedSearch = useDebounce(searchQuery, 500);

  /**
   * Reset page number when search changes
   *
   * When the debounced search query changes, reset the page to 1
   * to start showing results from the beginning.
   */
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  /**
   * Fetch movies when page or search changes
   *
   * Fetches either trending movies or search results based on the current state.
   * Handles both initial load and subsequent infinite scroll loads.
   */
  useEffect(() => {
    async function fetchMovies() {
      setLoading(true);

      try {
        // Fetch either trending movies or search results based on the current state
        const data = debouncedSearch
          ? await searchMovies(debouncedSearch, page)
          : await getTrendingMovies(page);

        // If it's the first page, replace the movies array
        // Otherwise, append to the existing array
        if (page === 1) {
          setMovies(data.results || []);
        } else {
          setMovies(prev => [...prev, ...(data.results || [])]);
        }
      } catch (error) {
        console.error("Error fetching movies:", error);
        // You could set an error state here to display to the user
      } finally {
        setLoading(false);
      }
    }

    fetchMovies();
  }, [page, debouncedSearch]);

  /**
   * Infinite Scroll Implementation
   *
   * Listens for scroll events and loads more content when the user
   * reaches the bottom of the page.
   */
  useEffect(() => {
    /**
     * handleScroll
     *
     * Checks if the user has scrolled near the bottom of the page.
     * If so, increments the page number to trigger loading more content.
     */
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

    // Add scroll event listener
    window.addEventListener("scroll", handleScroll);

    // Cleanup function to remove the event listener
    return () => window.removeEventListener("scroll", handleScroll);
  }, [loading]); // Re-run when loading state changes

  return (
    <>
      {/* Search bar component with search functionality */}
      <SearchBar onSearch={setSearchQuery} />

      {/* Movie grid displaying the current movies */}
      <MovieGrid movies={movies} />

      {/* Loading indicator shown during API calls */}
      {loading && (
        <p className="text-center py-6 text-white">Loading...</p>
      )}
    </>
  );
}

export default Home;