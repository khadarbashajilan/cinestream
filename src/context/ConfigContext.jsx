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

export const ConfigContext = createContext();

export function ConfigProvider({ children }) {
  const [images, setImages] = useState(null);

  async function fetchConfig() {
    try {
      const res = await fetch(
        `https://api.themoviedb.org/3/configuration?api_key=${import.meta.env.VITE_TMDB_API_KEY}`,
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      setImages(data.images);

    } catch (error) {
      console.error("Error fetching TMDB configuration:", error);
    }
  }

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <ConfigContext.Provider value={{ images }}>
      {children}
    </ConfigContext.Provider>
  );
}
