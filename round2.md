# 🎬 CineStream — Frontend System Design Challenge

> A production-quality React application that interfaces with The Movie Database (TMDB) API to display trending movies, enable search, and render movie detail pages — built with performance, scalability, and clean architecture in mind.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [High-Level Architecture](#2-high-level-architecture)
3. [Folder Structure](#3-folder-structure)
4. [Architecture & Technical Implementation](#4-architecture--technical-implementation)
   - [Configuration Bootstrap Pattern](#41-configuration-bootstrap-pattern)
   - [Optimized Image Component](#42-optimized-image-component-tmdbimagejsx)
   - [Search Logic — Debounce + Race Condition Guard](#43-search-logic--debounce--race-condition-guard)
5. [Feature Implementation](#5-feature-implementation)
6. [Performance & Optimization Strategies](#6-performance--optimization-strategies)
7. [UI/UX Decisions](#7-uiux-decisions)
8. [Environment Variables](#8-environment-variables)
9. [How to Run Locally](#9-how-to-run-locally)

---

## 1. Project Overview

CineStream is a **React + Vite** single-page application (SPA) that consumes the [TMDB REST API](https://developer.themoviedb.org/docs) to power a Netflix-style movie browser.

### What problem does it solve?

Most movie-browsing demos are quick prototypes: they hardcode image URLs, make redundant API calls, ignore loading states, and collapse on slow networks. CineStream is built to address all of that. Here is what it does well:

- **Single source of truth for image configuration** — TMDB image base URLs and available sizes are fetched *once* at app startup and shared everywhere via React Context, so no component ever hardcodes an image URL.
- **Responsive, optimized images** — the `<TMDBImage />` component uses `srcSet` so browsers automatically pick the right image resolution for the device screen, saving bandwidth on mobile.
- **Debounced search** — the search bar waits 500ms after the user stops typing before hitting the API, so a user typing "Avengers" fires one request, not eight.
- **Infinite scroll** — instead of pagination buttons, new content loads automatically as the user scrolls down, matching the UX of modern streaming platforms.
- **Service layer abstraction** — all API calls live in one file (`api.js`), so if TMDB changes their endpoint structure tomorrow, you change exactly one file.

---

## 2. High-Level Architecture

```
User's Browser
     │
     ▼
┌──────────────────────────────────────────┐
│               React App (Vite)           │
│                                          │
│  BrowserRouter (react-router-dom)        │
│       │                                  │
│  ConfigProvider  ←─ fetches TMDB config  │
│       │             once on mount        │
│       ▼                                  │
│     App.jsx                              │
│    ┌──────────────────────────────┐      │
│    │ Route: "/"   → Home.jsx      │      │
│    │ Route: "/:id"→ MovieDetails  │      │
│    └──────────────────────────────┘      │
│                                          │
│  Shared Components                       │
│   ├── SearchBar.jsx                      │
│   ├── Movies.jsx  (MovieGrid)            │
│   └── TMDBImage.jsx                      │
│                                          │
│  Hooks                                   │
│   └── useDebounce.js                     │
│                                          │
│  API Layer                               │
│   └── api.js  → TMDB REST API            │
└──────────────────────────────────────────┘
```

**Data flow in plain English:**
1. The app boots → `ConfigProvider` fetches TMDB image config and stores it in React Context.
2. `Home.jsx` fetches trending movies and renders them via `MovieGrid`.
3. User types in `SearchBar` → `useDebounce` delays the query → `Home.jsx` calls the search endpoint.
4. User clicks a movie card → React Router navigates to `/:id` → `MovieDetails.jsx` fetches that movie's details.
5. Every image rendered anywhere goes through `TMDBImage.jsx`, which reads the config from Context to build the correct URL.

---

## 3. Folder Structure

```
src/
├── api/
│   └── api.js               ← All TMDB API calls live here (service layer)
│
├── components/
│   ├── MovieDetails.jsx      ← Full-page movie detail view
│   ├── Movies.jsx            ← Responsive movie card grid
│   ├── Searchbar.jsx         ← Controlled search input
│   └── TMDBImage.jsx         ← Smart image component with srcSet + skeleton
│
├── context/
│   └── ConfigContext.jsx     ← Global TMDB config via React Context
│
├── hooks/
│   └── useDebounce.js        ← Custom hook: delays a value by N milliseconds
│
├── pages/
│   └── Home.jsx              ← Main page: trending feed + search + infinite scroll
│
├── App.css                   ← Global styles (Tailwind import + body defaults)
├── App.jsx                   ← Root component with router <Routes>
└── main.jsx                  ← App entry point — mounts providers
```

### Why is the folder structured this way?

This follows the **"separation of concerns"** principle:

- `api/` — knows about HTTP and TMDB endpoints. Nothing else.
- `components/` — reusable UI building blocks. They receive props and render UI. They do not fetch data (except `MovieDetails` which is tightly coupled to its route).
- `context/` — global state that multiple components need. Not putting this in a component prevents "prop drilling" (passing the same prop through 5 layers of components just to reach one child).
- `hooks/` — reusable logic that is not visual. A custom hook is just a JavaScript function that can use React hooks internally.
- `pages/` — top-level route components. They orchestrate data fetching and compose smaller components.

---

## 4. Architecture & Technical Implementation

### 4.1 Configuration Bootstrap Pattern

#### The problem it solves

TMDB serves images from a CDN. The base URL and the available image sizes (like `w185`, `w342`, `w500`) are not hardcoded values you should guess — TMDB provides them via a `/configuration` endpoint. If you hardcode `https://image.tmdb.org/t/p/w500`, you are:

- Assuming the base URL never changes (it might).
- Ignoring that TMDB might add/remove size options.
- Making every component independently responsible for knowing image URL structure.

#### The solution: fetch once, share everywhere

`ConfigContext.jsx` is a **React Context Provider**. It fetches the TMDB configuration exactly once when the app mounts, then makes that data available to every component in the tree without any component needing to fetch it again.

```jsx
// context/ConfigContext.jsx

export const ConfigContext = createContext();

export function ConfigProvider({ children }) {
  const [images, setImages] = useState(null); // null until data arrives

  useEffect(() => {
    async function fetchConfig() {
      const res = await fetch(
        `https://api.themoviedb.org/3/configuration?api_key=${import.meta.env.VITE_TMDB_API_KEY}`
      );
      const data = await res.json();
      setImages(data.images); // store: { secure_base_url, poster_sizes, backdrop_sizes }
    }
    fetchConfig();
  }, []); // ← empty array = runs once on mount, never again

  return (
    <ConfigContext.Provider value={{ images }}>
      {children}
    </ConfigContext.Provider>
  );
}
```

The config response looks like this:

```json
{
  "images": {
    "secure_base_url": "https://image.tmdb.org/t/p/",
    "poster_sizes": ["w92", "w154", "w185", "w342", "w500", "w780", "original"],
    "backdrop_sizes": ["w300", "w780", "w1280", "original"]
  }
}
```

#### How to consume the context in any component

```jsx
// Inside any component, anywhere in the tree:
import { useContext } from "react";
import { ConfigContext } from "../context/ConfigContext";

const { images } = useContext(ConfigContext);
// images.secure_base_url → "https://image.tmdb.org/t/p/"
// images.poster_sizes    → ["w92", "w154", ...]
```

#### Provider placement in `main.jsx`

```jsx
// main.jsx — the entry point
<BrowserRouter>
  <ConfigProvider>      {/* ← wraps the entire app */}
    <App />
  </ConfigProvider>
</BrowserRouter>
```

By wrapping `<App />` inside `<ConfigProvider>`, every component in the application — no matter how deeply nested — can call `useContext(ConfigContext)` and get the config data. This is the **Context API pattern** in React.

---

### 4.2 Optimized Image Component (`TMDBImage.jsx`)

#### The problem with a plain `<img>` tag

If you write `<img src="https://image.tmdb.org/t/p/original/poster.jpg" />`, you are:

1. Always loading a huge original-resolution image, even on a 375px-wide mobile screen.
2. Showing a blank white space while the image loads (jarring UX).
3. Hardcoding the URL structure.

#### The solution: `srcSet` for responsive images + skeleton loader

`TMDBImage.jsx` solves all three problems.

```jsx
// components/TMDBImage.jsx

function TMDBImage({ path, type = "poster", alt = "", className = "" }) {
  const { images } = useContext(ConfigContext);    // ← reads from global config
  const [loaded, setLoaded] = useState(false);    // ← tracks if image has loaded

  if (!path || !images) return null;

  const baseUrl = images.secure_base_url;  // "https://image.tmdb.org/t/p/"
  const sizes = type === "backdrop" ? images.backdrop_sizes : images.poster_sizes;

  // Pick a sensible default: w342 for posters, w780 for backdrops
  const defaultSize = type === "backdrop" ? "w780" : "w342";
  const src = `${baseUrl}${defaultSize}${path}`;

  // Build srcSet: "https://image.tmdb.org/t/p/w92/path.jpg 92w, .../w154/path.jpg 154w, ..."
  const srcSet = sizes
    .filter((size) => size !== "original")         // exclude the massive original
    .map((size) => `${baseUrl}${size}${path} ${size.replace("w", "")}w`)
    .join(", ");

  return (
    <div className={`relative overflow-hidden ${className}`}>

      {/* Skeleton: visible while image loads, animates with a pulse */}
      {!loaded && (
        <div className="absolute inset-0 bg-neutral-800 animate-pulse" />
      )}

      <img
        src={src}
        srcSet={srcSet}
        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-500 ${
          loaded ? "opacity-100" : "opacity-0"  // fade in when ready
        }`}
        onLoad={() => setLoaded(true)}  // ← triggers the fade-in
      />
    </div>
  );
}
```

#### How `srcSet` and `sizes` work together (explained simply)

Think of `srcSet` as a menu of options you give the browser:

```
srcSet="...w92/path.jpg 92w,
        ...w154/path.jpg 154w,
        ...w342/path.jpg 342w,
        ...w500/path.jpg 500w,
        ...w780/path.jpg 780w"
```

And `sizes` tells the browser how wide the image will actually be displayed on screen:

```
sizes="(max-width: 640px) 50vw,   ← on phones: image takes 50% of viewport width
       (max-width: 1024px) 33vw,  ← on tablets: 33% of viewport width
       20vw"                      ← on desktops: 20% of viewport width
```

The browser does the math: "I'm on a 375px phone, so the image will be ~187px wide. I'll pick the smallest image from `srcSet` that is ≥187px." That turns out to be `w185` or `w342`, instead of loading the full `w780` version. **This is a significant bandwidth saving.**

#### The skeleton loader pattern

```
Before image loads:              After image loads:
┌──────────────────┐             ┌──────────────────┐
│ ░░░░░░░░░░░░░░░░ │  →fades→   │  [movie poster]  │
│ ░░ pulsing grey ░│             │                  │
│ ░░░░░░░░░░░░░░░░ │             │                  │
└──────────────────┘             └──────────────────┘
  (animate-pulse)                  (opacity: 1)
```

The grey `div` sits in `position: absolute` and covers the container. When the image fires `onLoad`, `setLoaded(true)` triggers, the grey overlay is removed, and the image fades in with a 500ms CSS transition. This is far better UX than a blank white flash.

---

### 4.3 Search Logic — Debounce + Race Condition Guard

#### The problem: typing fires too many API requests

If you call the TMDB search API on every keystroke, typing "Avengers" fires 8 requests: "A", "Av", "Ave", "Aven", "Aveng", "Avenge", "Avenger", "Avengers". This wastes bandwidth and can cause **race conditions** — where older, slower requests arrive *after* newer ones and overwrite the correct results.

#### Solution 1: The `useDebounce` hook

```js
// hooks/useDebounce.js

export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    // Set a timer. If `value` changes before the timer fires, the timer resets.
    const timer = setTimeout(() => {
      setDebouncedValue(value);  // ← only updates after 500ms of silence
    }, delay);

    return () => clearTimeout(timer);  // ← cleanup: cancel the timer on re-render
  }, [value, delay]);

  return debouncedValue;
}
```

**How it works step by step:**

```
User types: A → v → e → n → g → e → r → s
            ↑   ↑   ↑   ↑   ↑   ↑   ↑   ↑
            Each keystroke resets the 500ms timer

            ...500ms of silence after "s"...
                                            ↓
                                    API called with "Avengers"
```

Only **one** API request is made, instead of eight.

#### How debounce is used in `Home.jsx`

```jsx
// pages/Home.jsx

const [searchQuery, setSearchQuery] = useState("");
const debouncedSearch = useDebounce(searchQuery, 500); // ← waits 500ms

// Reset to page 1 whenever the search term actually changes
useEffect(() => {
  setPage(1);
}, [debouncedSearch]);

// Fetch movies (this effect sees the DEBOUNCED value, not the raw query)
useEffect(() => {
  async function fetchMovies() {
    setLoading(true);
    const data = debouncedSearch
      ? await searchMovies(debouncedSearch, page)
      : await getTrendingMovies(page);

    if (page === 1) {
      setMovies(data.results || []);       // replace results on new search
    } else {
      setMovies(prev => [...prev, ...(data.results || [])]); // append for infinite scroll
    }
    setLoading(false);
  }
  fetchMovies();
}, [page, debouncedSearch]); // ← only fires when debounced value changes
```

**Why resetting `page` to 1 is critical:** If the user is on page 3 of "Batman" results and then types "Superman", you need to start from page 1 of the new search. Without the reset, you'd fetch page 3 of Superman results and append them to the Batman results — a broken experience.

---

### 4.4 The API Service Layer (`api.js`)

```js
// api/api.js

const BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

// Core function: all API calls funnel through here
async function fetchFromTMDB(endpoint, params = {}) {
  if (!API_KEY) throw new Error("key is missing");

  const queryParams = new URLSearchParams({ api_key: API_KEY, ...params }).toString();
  const url = `${BASE_URL}${endpoint}?${queryParams}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Error: ${response.status}`);
  return response.json();
}

// Public API: these are the only functions other files ever call
export async function getTrendingMovies(page = 1) {
  return fetchFromTMDB("/trending/movie/week", { page });
}

export async function searchMovies(query, page = 1) {
  return fetchFromTMDB("/search/movie", { query, page });
}
```

**Why this pattern matters:** `Home.jsx` and other components never know what the base URL is, how authentication works, or how `URLSearchParams` is constructed. If TMDB switches from API key auth to Bearer tokens, you update **one function** (`fetchFromTMDB`) and every feature continues to work. This is the **Single Responsibility Principle** applied to API calls.

---

## 5. Feature Implementation

### App Bootstrapping Flow

```
main.jsx
  └── mounts <BrowserRouter>
        └── mounts <ConfigProvider>
              │  ← fires useEffect → fetches TMDB config → stores in Context
              └── mounts <App>
                    └── renders <Routes>
                          ├── "/" → <Home>       ← fetches trending movies
                          └── "/:id" → <MovieDetails> ← fetches by ID
```

### Trending Movies Feed

On first load (`debouncedSearch` is empty), `Home.jsx` calls `getTrendingMovies(1)`. The response's `results` array is stored in the `movies` state and rendered by `MovieGrid`.

### Type-Ahead Search

The `SearchBar` component is a pure "controlled input" — it doesn't manage state itself. It calls `onSearch(value)` on every keystroke, which sets `searchQuery` in `Home.jsx`. The debounce hook ensures the actual API call only fires after the user pauses. This separation of concerns (SearchBar handles input events, Home handles data fetching) makes both components independently testable.

### Movie Detail View

```jsx
// components/MovieDetails.jsx

const { id } = useParams(); // ← reads /:id from the URL

useEffect(() => {
  fetch(`https://api.themoviedb.org/3/movie/${id}?api_key=...`)
    .then(res => res.json())
    .then(data => setMovie(data));
}, [id]); // ← re-fetches if the ID in the URL changes
```

When the user clicks a movie card in `Movies.jsx`, `useNavigate()` pushes `/${movie.id}` into the browser history. React Router matches this to the `/:id` route and renders `MovieDetails`. The `useParams()` hook reads the dynamic `id` from the URL.

### Infinite Scroll

```jsx
// pages/Home.jsx

useEffect(() => {
  const handleScroll = () => {
    const nearBottom =
      window.innerHeight + document.documentElement.scrollTop >=
      document.documentElement.scrollHeight - 100; // within 100px of bottom

    if (nearBottom && !loading) {
      setPage(prev => prev + 1); // ← incrementing page triggers the fetch useEffect
    }
  };

  window.addEventListener("scroll", handleScroll);
  return () => window.removeEventListener("scroll", handleScroll); // cleanup
}, [loading]);
```

When the page increments, the fetch `useEffect` fires again with the new page number. If `page > 1`, the new results are *appended* to the existing array (not replaced), creating a continuous scrolling list.

---

## 6. Performance & Optimization Strategies

### Image Optimization

| Technique | Implementation | Benefit |
|---|---|---|
| `srcSet` | `TMDBImage.jsx` builds a srcSet from all poster sizes | Browser downloads the smallest adequate image |
| `sizes` attribute | Tells browser the display width at each breakpoint | Accurate size selection without JS |
| Skeleton loader | Grey animated placeholder via Tailwind `animate-pulse` | No layout shift, better perceived performance |
| Exclude `original` | `.filter(size => size !== "original")` | Never downloads a 5MB image when a 300KB one suffices |
| `object-cover` | CSS on the `<img>` | Images fill their container without distortion |

### Network Request Optimization

- **Single config fetch:** `ConfigProvider` fetches TMDB config once at startup via an empty `useEffect` dependency array. Without this, every `TMDBImage` component might independently fetch the config.
- **Debouncing:** 500ms debounce in `useDebounce.js` prevents search from firing on every keystroke.
- **Service layer:** `api.js` centralizes request construction, making it trivial to add caching headers, interceptors, or request deduplication in one place in the future.

### Rendering Optimization

- **Conditional append vs. replace:** In `Home.jsx`, the fetch result is either set fresh (`page === 1`) or spread into the existing array (`page > 1`). This avoids re-rendering the entire list from scratch on scroll.
- **Tailwind CSS:** All styles are utility classes compiled at build time — no runtime CSS-in-JS computation, no class name generation overhead.

---

## 7. UI/UX Decisions

### Dark Theme

The entire app uses a dark colour palette (`bg-neutral-900`, `bg-neutral-800`) established in `App.jsx` and `App.css`. Dark themes reduce eye strain during evening browsing and have become the standard for entertainment apps. Tailwind's neutral palette (`neutral-800`, `neutral-700`, `neutral-400`) provides enough contrast levels to establish visual hierarchy without importing a separate design system.

### Responsive Grid

```jsx
// components/Movies.jsx
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
```

This single Tailwind class string creates a fully responsive layout:

| Screen width | Columns | Example device |
|---|---|---|
| < 640px | 2 | Phone |
| 640px – 768px | 3 | Large phone / small tablet |
| 768px – 1024px | 4 | Tablet |
| > 1024px | 5 | Desktop |

### Interaction Effects

- **Card hover scale:** `hover:scale-105 transition` on movie cards gives tactile feedback that items are clickable, implemented with a single Tailwind class (no custom CSS).
- **Fade-in on image load:** `transition-opacity duration-500` in `TMDBImage` creates a smooth reveal instead of an abrupt pop-in.
- **Focus ring on search:** `focus:ring-2 focus:ring-blue-500` ensures keyboard navigability and accessibility on the search input.

### Back Navigation

`MovieDetails.jsx` uses `useNavigate()` with `navigate("/")` to return the user to the home page. This uses the browser History API (managed by React Router), so the back button also works correctly.

---

## 8. Environment Variables

The app requires a TMDB API key. Create a `.env` file in the project root:

```
VITE_TMDB_API_KEY=your_api_key_here
```

Vite exposes environment variables prefixed with `VITE_` to the client bundle via `import.meta.env`. Variables without this prefix are intentionally kept server-side only. Never commit your `.env` file to source control — add it to `.gitignore`.

The key is consumed in two places:

```js
// api/api.js
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

// context/ConfigContext.jsx
`...?api_key=${import.meta.env.VITE_TMDB_API_KEY}`
```

`api.js` includes a guard for a missing key:

```js
if (!API_KEY) {
  throw new Error("key is missing");
}
```

This surfaces a clear error message during development rather than a cryptic 401 HTTP response.

---

## 9. How to Run Locally

### Prerequisites

- Node.js 18+ installed
- A free TMDB API key from [themoviedb.org](https://www.themoviedb.org/settings/api)

### Steps

```bash
# 1. Clone the repository
git clone <repo-url>
cd cinestream

# 2. Install dependencies
npm install

# 3. Create your environment file
echo "VITE_TMDB_API_KEY=your_key_here" > .env

# 4. Start the development server
npm run dev
```

Open `http://localhost:5173` in your browser. The app will hot-reload on any file change.

### Build for production

```bash
npm run build    # outputs to /dist
npm run preview  # serves the production build locally
```

---

## Summary

CineStream demonstrates several patterns that separate beginner React code from production-grade code:

| Pattern | What it does | Why it matters |
|---|---|---|
| **Context API Bootstrap** | Fetches config once, shares it everywhere | No hardcoded URLs, no redundant API calls |
| **Custom `useDebounce` Hook** | Delays search API calls | Saves bandwidth, better UX |
| **`srcSet` + `sizes`** | Browser picks optimal image resolution | Faster load times on mobile |
| **Skeleton Loading** | Placeholder UI while images fetch | No layout shift, professional feel |
| **Service Layer (`api.js`)** | All HTTP calls in one place | Easy to maintain and extend |
| **Infinite Scroll via scroll events** | Loads more content as user scrolls | Modern content-browsing UX |
| **Route-based code split** | Separate pages for home and detail | Clean URL structure, bookmarkable pages |

Each of these is an established industry pattern. Understanding why each exists — not just how to copy it — is what separates a junior developer from a mid-level one.