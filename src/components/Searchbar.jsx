function SearchBar({ onSearch }) {
  return (
    <div className="w-full max-w-2xl mx-auto mb-20">
      <input
        type="text"
        placeholder="Search movies..."
        onChange={(e) => onSearch(e.target.value)}
        className="w-full px-4 py-3 bg-neutral-800 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

export default SearchBar;