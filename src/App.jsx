import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import MovieDetails from "./components/MovieDetails.jsx";

function App() {
  return (
    <div className="min-h-screen bg-neutral-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-6">
          CineStream
        </h1>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/:id" element={<MovieDetails />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
