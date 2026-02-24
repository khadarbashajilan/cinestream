# CineStream - Detailed Code Documentation

## Table of Contents
1. [API Layer (`api.js`)](#api-layer-apijs)
2. [Main Application Component (`App.jsx`)](#main-application-component-appjsx)
3. [Optimized Image Component (`TMDBImage.jsx`)](#optimized-image-component-tmdbimagejsx)
4. [Configuration Context (`ConfigContext.jsx`)](#configuration-context-configcontextjsx)
5. [Home Page (`Home.jsx`)](#home-page-homejsx)
6. [Configuration Content (`ConfigContent.json`)](#configuration-content-configcontentjson)

---

## API Layer (`api.js`)

```javascript
// api/api.js

// Base URL for TMDB API
const BASE_URL = "https://api.themoviedb.org/3";

// API key loaded from environment variables
// VITE_ prefix is required for Vite to expose it to the client
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

/**
 * Core function that handles all API requests to TMDB
 * @param {string} endpoint - The API endpoint to call (e.g., "/trending/movie/week")
 * @param {object} params - Query parameters to include in the request
 * @returns {Promise<object>} The parsed JSON response from the API
 */
async function fetchFromTMDB(endpoint, params = {}) {
  // Check if API key is available
  if (!API_KEY) {
    throw new Error("key is missing");
  }

  // Create query parameters string
  // URLSearchParams automatically handles URL encoding
  // Includes the API key and any additional parameters
  const queryParams = new URLSearchParams({
    api_key: API_KEY,
    ...params,
  }).toString();

  // Construct the full URL
  const url = `${BASE_URL}${endpoint}?${queryParams}`;

  try {
    // Make the API request
    const response = await fetch(url);

    // Check if the response was successful
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    // Parse and return the JSON response
    const data = await response.json();
    return data;

  } catch (error) {
    // Log any errors that occur during the request
    console.error("API Error:", error.message);
    // Re-throw the error to be handled by the calling function
    throw new Error(error.message);
  }
}

/**
 * Get trending movies from TMDB
 * @param {number} page - The page number to fetch (default: 1)
 * @returns {Promise<object>} The API response containing trending movies
 */
export async function getTrendingMovies(page = 1) {
  // Call the core fetch function with the trending movies endpoint
  return fetchFromTMDB("/trending/movie/week", { page });
}

/**
 * Search for movies in TMDB
 * @param {string} query - The search query
 * @param {number} page - The page number to fetch (default: 1)
 * @returns {Promise<object>} The API response containing search results
 */
export async function searchMovies(query, page = 1) {
  // Call the core fetch function with the search endpoint
  return fetchFromTMDB("/search/movie", { query, page });
}
```

---

## Main Application Component (`App.jsx`)

```javascript
// App.jsx

// Import necessary components from react-router-dom
import { Routes, Route } from "react-router-dom";

// Import page components
import Home from "./pages/Home.jsx";
import MovieDetails from "./components/MovieDetails.jsx";

/**
 * Main application component that sets up the app structure
 * @returns {JSX.Element} The rendered application
 */
function App() {
  return (
    // Main container with dark theme styling
    // min-h-screen ensures it takes at least the full viewport height
    // bg-neutral-900 sets the dark background color
    // text-white sets the default text color to white
    // p-4 adds padding around the content
    <div className="min-h-screen bg-neutral-900 text-white p-4">
      {/* Centered container with max-width for better readability on large screens */}
      <div className="max-w-7xl mx-auto">
        {/* Main application title */}
        <h1 className="text-3xl font-bold text-center mb-6">
          CineStream
        </h1>

        {/* Router configuration */}
        <Routes>
          {/* Home route - displays the main movie grid */}
          <Route path="/" element={<Home />} />

          {/* Movie details route - shows detailed information for a specific movie */}
          {/* The :id parameter is captured and can be accessed in MovieDetails */}
          <Route path="/:id" element={<MovieDetails />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
```

---

## Optimized Image Component (`TMDBImage.jsx`)

```javascript
// components/TMDBImage.jsx

// Import necessary hooks and context
import { useContext, useState } from "react";
import { ConfigContext } from "../context/ConfigContext";

/**
 * Optimized image component that handles responsive image loading
 * @param {Object} props - Component props
 * @param {string} props.path - The image path from TMDB
 * @param {string} [props.type="poster"] - Type of image ("poster" or "backdrop")
 * @param {string} [props.alt=""] - Alt text for the image
 * @param {string} [props.className=""] - Additional CSS classes for the container
 * @returns {JSX.Element} The rendered image component
 */
function TMDBImage({
  path,
  type = "poster", // Default to "poster" if not specified
  alt = "",        // Default empty alt text
  className = "",  // Default empty additional classes
}) {
  // Get the images configuration from the context
  // This contains the base URL and available image sizes
  const { images } = useContext(ConfigContext);

  // State to track if the image has loaded
  // Used for the skeleton loader and fade-in effect
  const [loaded, setLoaded] = useState(false);

  // If there's no path or images config is not available, return null
  // This prevents rendering broken image tags
  if (!path || !images) return null;

  // Extract the secure base URL from the configuration
  // This is where all TMDB images are served from
  const baseUrl = images.secure_base_url;  // "https://image.tmdb.org/t/p/"

  // Choose the appropriate sizes based on the image type
  // Backdrops typically have wider aspect ratios than posters
  const sizes = type === "backdrop" ? images.backdrop_sizes : images.poster_sizes;

  // Select a sensible default size based on the image type
  // w342 is a good balance for posters (342px wide)
  // w780 is a good balance for backdrops (780px wide)
  const defaultSize = type === "backdrop" ? "w780" : "w342";

  // Construct the default image source URL
  // Combines the base URL, default size, and image path
  const src = `${baseUrl}${defaultSize}${path}`;

  // Build the srcSet attribute
  // This provides multiple image sizes for the browser to choose from
  // The browser will select the most appropriate size based on the device
  const srcSet = sizes
    .filter((size) => size !== "original")         // Exclude the massive original size
    .map((size) => `${baseUrl}${size}${path} ${size.replace("w", "")}w`) // Format: "url widthw"
    .join(", "); // Join all sizes with commas

  return (
    // Container div with relative positioning and overflow hidden
    // This ensures the image doesn't overflow its container
    <div className={`relative overflow-hidden ${className}`}>

      {/* Skeleton loader - visible while image is loading */}
      {/* Shows a pulsing grey background as a placeholder */}
      {!loaded && (
        <div className="absolute inset-0 bg-neutral-800 animate-pulse" />
      )}

      {/* Main image element */}
      <img
        src={src}          // Default image source
        srcSet={srcSet}    // Multiple image sources for responsive loading
        // sizes attribute tells the browser how wide the image will be displayed
        // at different screen sizes
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        alt={alt}          // Accessibility alt text
        // Image styling:
        // w-full - full width of container
        // h-full - full height of container
        // object-cover - ensures the image covers the container without distortion
        // transition-opacity - enables smooth opacity transitions
        // duration-500 - 500ms transition duration
        // loaded ? "opacity-100" : "opacity-0" - fade in when loaded
        className={`w-full h-full object-cover transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        // Set loaded state to true when image finishes loading
        // This will trigger the fade-in effect
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

export default TMDBImage;
```

---

## Configuration Context (`ConfigContext.jsx`)

```javascript
// context/ConfigContext.jsx

// Import necessary React hooks
import { createContext, useEffect, useState } from "react";

// Create a new context for TMDB configuration
// This will be used to share the configuration data throughout the app
export const ConfigContext = createContext();

/**
 * ConfigProvider component that fetches and provides TMDB configuration
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components that will have access to the config
 * @returns {JSX.Element} The context provider that wraps the application
 */
export function ConfigProvider({ children }) {
  // State to store the TMDB images configuration
  // Initialized as null until data is fetched
  const [images, setImages] = useState(null);

  /**
   * useEffect Hook
   *
   * Fetches the TMDB configuration when the component mounts.
   * This effect runs only once (empty dependency array).
   */
  useEffect(() => {
    /**
     * fetchConfig
     *
     * Asynchronous function to fetch the TMDB configuration from the API.
     * Uses the API key from environment variables.
     */
    async function fetchConfig() {
      try {
        // Fetch configuration from TMDB API
        // The API key is loaded from environment variables
        const res = await fetch(
          `https://api.themoviedb.org/3/configuration?api_key=${import.meta.env.VITE_TMDB_API_KEY}`
        );

        // Check if the response is successful
        // If not, throw an error with the status code
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        // Parse the JSON response
        // This contains the configuration data including image settings
        const data = await res.json();

        // Store the images configuration in state
        // This includes:
        // - secure_base_url: The base URL for images
        // - poster_sizes: Available poster sizes
        // - backdrop_sizes: Available backdrop sizes
        setImages(data.images);
      } catch (error) {
        // Log any errors that occur during the fetch
        console.error("Error fetching TMDB configuration:", error);
        // You could set a default configuration here if needed
        // For example:
        // setImages({
        //   secure_base_url: "https://image.tmdb.org/t/p/",
        //   poster_sizes: ["w92", "w154", "w185", "w342", "w500", "w780"],
        //   backdrop_sizes: ["w300", "w780", "w1280"]
        // });
      }
    }

    // Call the fetch function
    fetchConfig();
  }, []); // Empty dependency array means this runs once on mount

  /**
   * Context Provider
   *
   * Provides the images configuration to all child components.
   * The value is an object with the images property.
   */
  return (
    <ConfigContext.Provider value={{ images }}>
      {children}
    </ConfigContext.Provider>
  );
}
```

---

## Home Page (`Home.jsx`)

```javascript
// pages/Home.jsx

// Import necessary hooks and components
import { useState, useEffect } from "react";
import { getTrendingMovies, searchMovies } from "../api/api.js";
import { useDebounce } from "../hooks/useDebounce.js";
import SearchBar from "../components/Searchbar.jsx";
import MovieGrid from "../components/Movies.jsx";
import "../App.css";

/**
 * Home page component that displays trending movies and search results
 * @returns {JSX.Element} The rendered home page
 */
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
```

---

## Configuration Content (`ConfigContent.json`)

```json
{
  // Images configuration from TMDB
  "images": {
    // Base URL for all images
    // All image paths should be appended to this URL
    "secure_base_url": "https://image.tmdb.org/t/p/",

    // Available poster sizes
    // These are the different width options for poster images
    // The "original" size is typically very large (often several MB)
    "poster_sizes": ["w92","w154","w185","w342","w500","w780","original"],

    // Available backdrop sizes
    // These are the different width options for backdrop images
    // Backdrops are typically wider than posters
    "backdrop_sizes": ["w300","w780","w1280","original"]
  }
}