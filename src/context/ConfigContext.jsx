/**
 * ConfigContext and ConfigProvider
 *
 * This context provides TMDB (The Movie Database) configuration data to all components in the application.
 * It fetches the configuration once when the app loads and makes it available throughout the component tree.
 *
 * The configuration includes important image settings like:
 * - Base image URLs
 * - Available image sizes
 * - Secure base URLs for HTTPS
 *
 * This prevents multiple components from making the same API call and ensures consistent configuration.
 */

import { createContext, useEffect, useState } from "react";

/**
 * ConfigContext
 *
 * The context that will hold the TMDB configuration data.
 * Components can access this data using the useContext hook.
 */
export const ConfigContext = createContext();

/**
 * ConfigProvider Component
 *
 * Provides the TMDB configuration to all child components.
 * Fetches the configuration when the component mounts and makes it available via context.
 *
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components that will have access to the config
 * @returns {JSX.Element} A context provider that wraps the application
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
        const res = await fetch(
          `https://api.themoviedb.org/3/configuration?api_key=${import.meta.env.VITE_TMDB_API_KEY}`
        );

        // Check if the response is successful
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        // Parse the JSON response
        const data = await res.json();

        // Store the images configuration in state
        setImages(data.images);
      } catch (error) {
        console.error("Error fetching TMDB configuration:", error);
        // You could set a default configuration here if needed
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