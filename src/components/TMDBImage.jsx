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
 */
import { useContext, useState } from "react";
import { ConfigContext } from "../context/ConfigContext";

function TMDBImage({
  path,
  type = "poster", // "poster" | "backdrop"
  alt = "",
  className = "",
}) {
  // Get TMDB configuration 
  const { images } = useContext(ConfigContext);


  const [loaded, setLoaded] = useState(false);


  if (!path || !images) return null;


  const baseUrl = images.secure_base_url;

  // Choose appropriate sizes based on image type
  const sizes =
    type === "backdrop" ? images.backdrop_sizes : images.poster_sizes;

    
  const defaultSize = type === "backdrop" ? "w780" : "w342";


  const src = `${baseUrl}${defaultSize}${path}`;

  /**
   * Generate srcSet attribute for responsive images
   * Creates a comma-separated list of image URLs with their widths
   * Example: "https://image.tmdb.org/t/p/w300/path.jpg 300w, https://image.tmdb.org/t/p/w500/path.jpg 500w"
   */
  const srcSet = sizes
    .filter((size) => size !== "original") 
    
    .map((size) => `${baseUrl}${size}${path} ${size.replace("w", "")}w`)
    .join(", ");

  return (
    <div className={`relative overflow-hidden ${className}`}>

      {!loaded && (
        <div className="absolute inset-0 bg-neutral-800 animate-pulse" />
      )}


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

        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

export default TMDBImage;
