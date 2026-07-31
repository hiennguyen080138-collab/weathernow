import React, { useState, useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import api from "./services/api";

// Components
import Navbar from "./components/Navbar";
import CurrentWeather from "./components/CurrentWeather";
import HourlyForecast from "./components/HourlyForecast";
import DailyForecast from "./components/DailyForecast";
import FavoritesDrawer from "./components/FavoritesDrawer";
import AuthModal from "./components/AuthModal";
import AdminPanel from "./components/AdminPanel";
import UserSettingsModal from "./components/UserSettingsModal";

export default function App() {
  const { currentUser, userRole } = useAuth();

  // State quản lý thời tiết
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [searchCity, setSearchCity] = useState("Ho Chi Minh");

  // State quản lý Modal / Drawer
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState("login");
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isUserSettingsOpen, setIsUserSettingsOpen] = useState(false);

  // State Yêu thích
  const [favorites, setFavorites] = useState([]);

  // State trigger reload cho FavoritesDrawer
  const [favRefreshKey, setFavRefreshKey] = useState(0);

  // State đơn vị nhiệt độ toàn cục ('C' hoặc 'F')
  const [unit, setUnit] = useState("C");

  // Hàm quy đổi nhiệt độ: nhận giá trị gốc theo °C, trả về số đã làm tròn theo `unit` hiện tại
  const convertTemp = (tempC) => {
    if (tempC == null || Number.isNaN(tempC)) return "—";
    if (unit === "F") {
      return Math.round(tempC * 1.8 + 32);
    }
    return Math.round(tempC);
  };

  const toggleUnit = () => {
    setUnit((prev) => (prev === "C" ? "F" : "C"));
  };

  // Fetch thông tin thời tiết
  const fetchWeather = async (params) => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/weather", { params });
      setWeatherData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải dữ liệu thời tiết!");
    } finally {
      setLoading(false);
    }
  };

  // Fetch danh sách yêu thích nếu đã đăng nhập
  const fetchFavorites = async () => {
    if (!currentUser) return;
    try {
      const response = await api.get("/favorites");
      setFavorites(response.data?.data || []);
    } catch (err) {
      console.error("Lỗi tải danh sách yêu thích:", err);
    }
  };

  // Hàm xử lý khi toggle yêu thích thành công
  const handleToggleFavoriteSuccess = () => {
    fetchFavorites();
    setFavRefreshKey((prev) => prev + 1); // Đổi key để FavoritesDrawer tự fetch lại
  };

  // Gộp thành 1 useEffect duy nhất tự động tải dữ liệu chuẩn xác khi currentUser hoặc searchCity thay đổi
  useEffect(() => {
    fetchWeather({ city: searchCity });
    if (currentUser) {
      fetchFavorites();
    } else {
      setFavorites([]);
    }
  }, [currentUser, searchCity]);

  // Xử lý tìm kiếm thành phố
  const handleSearch = (city) => {
    setSearchCity(city);
    fetchWeather({ city });
  };

  // Xử lý lấy vị trí GPS
  const handleLocation = () => {
    if (!navigator.geolocation) {
      alert("Trình duyệt của bạn không hỗ trợ Geolocation.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchWeather({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      },
      () => alert("Không thể lấy vị trí hiện tại của bạn!")
    );
  };

  const handleOpenAuth = (tab = "login") => {
    setAuthTab(tab);
    setIsAuthOpen(true);
  };

  // Kiểm tra xem địa điểm hiện tại đã có trong mảng favorites chưa
  const currentCityName = weatherData?.data?.location?.name;
  const isCurrentFavorite = favorites.some(
    (fav) => fav.cityName?.toLowerCase() === currentCityName?.toLowerCase()
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-body">
      <Navbar
        onSearch={handleSearch}
        onUseGeolocation={handleLocation}
        onOpenAuth={handleOpenAuth}
        onOpenFavorites={() => setIsFavoritesOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenUserSettings={() => setIsUserSettingsOpen(true)}
        unit={unit}
        onToggleUnit={toggleUnit}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 space-y-6">
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-4 rounded-xl text-center">
            {error}
          </div>
        )}

        {!loading && weatherData && weatherData.data && (
          <>
            <CurrentWeather
              weather={weatherData.data}
              isFavorite={isCurrentFavorite}
              onToggleFavorite={handleToggleFavoriteSuccess}
              unit={unit}
              convertTemp={convertTemp}
            />

            {!currentUser && (
              <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/40 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg backdrop-blur-md">
                <div className="space-y-1 text-center md:text-left">
                  <h4 className="font-semibold text-amber-300 text-lg">
                    🔒 Bạn đang xem dữ liệu thời tiết cơ bản
                  </h4>
                  <p className="text-slate-300 text-sm">
                    Đăng nhập ngay để mở khóa dự báo 24 giờ, 7 ngày tới và Chỉ số chất lượng không khí (AQI)!
                  </p>
                </div>
                <button
                  onClick={() => handleOpenAuth("login")}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-xl transition whitespace-nowrap"
                >
                  Đăng nhập ngay
                </button>
              </div>
            )}

            {(weatherData.accessLevel === "user" || weatherData.accessLevel === "admin") && (
              <div className="space-y-6">
                {weatherData.data.hourly24h && (
                  <HourlyForecast hourly={weatherData.data.hourly24h} unit={unit} convertTemp={convertTemp} />
                )}
                {weatherData.data.daily7d && (
                  <DailyForecast daily={weatherData.data.daily7d} unit={unit} convertTemp={convertTemp} />
                )}
              </div>
            )}
          </>
        )}
      </main>

      <FavoritesDrawer
        open={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        refreshKey={favRefreshKey}
        onSelectCity={(fav) => {
          if (fav?.cityName) {
            handleSearch(fav.cityName);
          }
          setIsFavoritesOpen(false);
        }}
      />

      <AuthModal
        open={isAuthOpen}
        initialTab={authTab}
        onClose={() => setIsAuthOpen(false)}
      />

      <UserSettingsModal
        open={isUserSettingsOpen}
        onClose={() => setIsUserSettingsOpen(false)}
      />

      {userRole === "admin" && (
        <AdminPanel open={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
      )}
    </div>
  );
}