import { useNavigate } from "react-router-dom";

function MovieGrid({ movies }) {
  const navigate = useNavigate();

   if (!movies || movies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          No Movies Found
        </h2>
        <p className="text-neutral-400 mb-6">
          Try searching for something else.
        </p>


      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {movies.map((movie) => (
        <div
          key={movie.id}
          onClick={() => navigate(`/${movie.id}`)} 
          className="bg-neutral-800 rounded-lg cursor-pointer hover:scale-105 transition"
        >
          <div className="h-72">
            {movie.poster_path ? (
              <img
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-neutral-700 text-sm text-white">
                No Image
              </div>
            )}
          </div>

          <div className="p-3">
            <h3 className="text-sm font-semibold text-white">
              {movie.title}
            </h3>
          </div>
        </div>
      ))}
    </div>
  );
}

export default MovieGrid;