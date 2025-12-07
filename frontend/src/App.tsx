import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import MintPage from "./pages/MintPage";
import MarketplacePage from "./pages/MarketplacePage";

function Navigation() {
  const location = useLocation();

  return (
    <nav className="bg-gray-800/50 backdrop-blur border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex space-x-8">
            <Link
              to="/"
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                location.pathname === "/"
                  ? "bg-violet-600 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              Mint NFT
            </Link>
            <Link
              to="/marketplace"
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                location.pathname === "/marketplace"
                  ? "bg-violet-600 text-white"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              Marketplace
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <Routes>
        <Route path="/" element={<MintPage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
