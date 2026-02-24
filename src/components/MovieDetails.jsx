import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import TMDBImage from "./TMDBImage.jsx";

function MovieDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);

  useEffect(() => {
    async function fetchMovie() {
      const res = await fetch(
        `https://api.themoviedb.org/3/movie/${id}?api_key=${import.meta.env.VITE_TMDB_API_KEY}`,
      );
      const data = await res.json();
      setMovie(data);
    }

    fetchMovie();
  }, [id]);

  if (!movie) return <p>Loading...</p>;

  return (
    <div className="mt-6">
      <button
        onClick={() => navigate("/")}
        className="mb-6 bg-red-600 px-4 py-2 rounded"
      >
        ← Back
      </button>

      <div className="flex flex-col md:flex-row gap-6">
        {movie.poster_path ? (
          <TMDBImage
            path={movie.poster_path}
            type="poster"
            alt={movie.title}
            className="w-full md:w-1/3 rounded-lg"
          />
        ) : (
          <div>No Image</div>
        )}

        <div className="space-y-4">
          <h2 className="text-2xl font-bold">{movie.title}</h2>
          <p className="text-neutral-400">{movie.release_date}</p>
          <p>{movie.overview}</p>
        </div>
      </div>
    </div>
  );
}

export default MovieDetails;
