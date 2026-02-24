/**
 * TMDBImage Component
 *
 * A responsive image component that fetches images from The Movie Database (TMDB)
 * with optimized loading and responsive sizing.
 *
 * Features:
 * - Responsive image loading with srcSet and sizes attributes
 * - Skeleton loading placeholder while image loads
 * - Support for different image types (poster, backdrop)
 * - Optimized default sizes for different screen sizes
 *
 * @component
 * @param {Object} props - Component props
 * @param {string} props.path - The image path from TMDB
 * @param {string} [props.type="poster"] - Type of image ("poster" or "backdrop")
 * @param {string} [props.alt=""] - Alt text for the image
 * @param {string} [props.className=""] - Additional CSS classes for the container
 * @returns {JSX.Element} A responsive image component with loading state
 */
import { useContext, useState } from "react";
import { ConfigContext } from "../context/ConfigContext";

function TMDBImage({
  path,
  type = "poster", // "poster" | "backdrop"
  alt = "",
  className = "",
}) {
  // Get TMDB configuration from context
  const { images } = useContext(ConfigContext);

  // State to track if image has loaded
  const [loaded, setLoaded] = useState(false);

  // Early return if no path or images config is available
  if (!path || !images) return null;

  // Base URL for TMDB images
  const baseUrl = images.secure_base_url;

  // Choose appropriate sizes based on image type
  // backdrop_sizes for wide images, poster_sizes for vertical images
  const sizes =
    type === "backdrop" ? images.backdrop_sizes : images.poster_sizes;

  // Select optimized default size (not the original large size)
  // w780 for backdrops (780px wide), w342 for posters (342px wide)
  const defaultSize = type === "backdrop" ? "w780" : "w342";

  // Construct the default image source URL
  const src = `${baseUrl}${defaultSize}${path}`;

  /**
   * Generate srcSet attribute for responsive images
   * Creates a comma-separated list of image URLs with their widths
   * Example: "https://image.tmdb.org/t/p/w300/path.jpg 300w, https://image.tmdb.org/t/p/w500/path.jpg 500w"
   */
  const srcSet = sizes
    .filter((size) => size !== "original") // Exclude the original large size
    .map((size) => `${baseUrl}${size}${path} ${size.replace("w", "")}w`)
    .join(", ");

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Skeleton Loader - Shows while image is loading */}
      {!loaded && (
        <div className="absolute inset-0 bg-neutral-800 animate-pulse" />
      )}

      {/* Main Image */}
      <img
        src={src}
        srcSet={srcSet}
        // Responsive sizes attribute - tells browser how much space to allocate
        // For mobile: 50vw, for tablets: 33vw, for desktop: 20vw
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
        // Set loaded state to true when image finishes loading
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

export default TMDBImage;
