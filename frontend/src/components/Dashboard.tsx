import React, { useState, useEffect } from "react";
import {
  useActiveAccount,
  useDisconnect,
  useActiveWallet,
  Blobbie,
} from "thirdweb/react";
import {
  LogOut,
  TrendingUp,
  TrendingDown,
  Activity,
  Settings,
  Copy,
  Check,
  Shield,
  PieChart,
  DollarSign,
  Calendar,
  BarChart3,
  AlertCircle,
  ExternalLink,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import A11LogoBordered from "./A11LogoBordered";
import type { ThirdwebClient } from "thirdweb";

interface DashboardProps {
  client?: ThirdwebClient;
  fundId?: number;
}

const COLORS = ["#f59e0b", "#3b82f6", "#10b981"];
const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3001"
).replace(/\/$/, "");

const Dashboard: React.FC<DashboardProps> = ({  fundId = 1 }) => {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();

  // UI State
  const [userName, setUserName] = useState<string>("");
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [mintAmount, setMintAmount] = useState<string>("");
  const [redeemAmount, setRedeemAmount] = useState<string>("");

  // Data State
  const [fundData, setFundData] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [portfolioData, setPortfolioData] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [marketData, setMarketData] = useState<any[]>([]);

  // Loading & Error State
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (account?.address) {
      const savedName = localStorage.getItem(`userName_${account.address}`);
      if (savedName) {
        setUserName(savedName);
      } else {
        setUserName("family member");
      }
    }
  }, [account?.address]);

  // Fetch all data
  useEffect(() => {
    const fetchAllData = async () => {
      if (!account?.address) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch all data in parallel
        const [
          fundResponse,
          userResponse,
          performanceResponse,
          portfolioResponse,
          transactionsResponse,
          activitiesResponse,
          marketResponse,
        ] = await Promise.all([
          fetch(`${API_URL}/api/fund/${fundId}`),
          fetch(`${API_URL}/api/user-shares/${account.address}`),
          fetch(`${API_URL}/api/fund-performance/${fundId}`),
          fetch(`${API_URL}/api/portfolio-assets/${fundId}`),
          fetch(`${API_URL}/api/transactions/${account.address}`),
          fetch(`${API_URL}/api/fund-activities/${fundId}`),
          fetch(`${API_URL}/api/market-data`),
        ]);

        // Parse responses
        if (fundResponse.ok) {
          const data = await fundResponse.json();
          setFundData(data);
        } else {
          console.error("Failed to fetch fund data");
        }

        if (userResponse.ok) {
          const data = await userResponse.json();
          setUserData(data);
        } else {
          console.error("Failed to fetch user data");
        }

        if (performanceResponse.ok) {
          const data = await performanceResponse.json();
          setPerformanceData(data);
        } else {
          console.error("Failed to fetch performance data");
        }

        if (portfolioResponse.ok) {
          const data = await portfolioResponse.json();
          setPortfolioData(data);
        } else {
          console.error("Failed to fetch portfolio data");
        }

        if (transactionsResponse.ok) {
          const data = await transactionsResponse.json();
          setTransactions(data);
        } else {
          console.error("Failed to fetch transactions");
        }

        if (activitiesResponse.ok) {
          const data = await activitiesResponse.json();
          setActivities(data);
        } else {
          console.error("Failed to fetch activities");
        }

        if (marketResponse.ok) {
          const data = await marketResponse.json();
          setMarketData(data);
        } else {
          console.error("Failed to fetch market data");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [account?.address, fundId]);

  // Refetch data every 30 seconds
  useEffect(() => {
    if (!account?.address) return;

    const interval = setInterval(async () => {
      try {
        // Refetch volatile data (market data, activities)
        const [marketResponse, activitiesResponse] = await Promise.all([
          fetch(`${API_URL}/api/market-data`),
          fetch(`${API_URL}/api/fund-activities/${fundId}`),
        ]);

        if (marketResponse.ok) {
          const data = await marketResponse.json();
          setMarketData(data);
        }

        if (activitiesResponse.ok) {
          const data = await activitiesResponse.json();
          setActivities(data);
        }
      } catch (err) {
        console.error("Error refreshing data:", err);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [account?.address, fundId]);

  const formatAddress = (addr: string): string => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatNumber = (value: number, decimals: number = 2): string => {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  const handleSaveName = () => {
    if (account?.address && userName.trim()) {
      localStorage.setItem(`userName_${account.address}`, userName.trim());
      setIsEditingName(false);
    }
  };

  const copyAddress = () => {
    if (account?.address) {
      navigator.clipboard.writeText(account.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
    if (wallet) {
      disconnect(wallet);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="h-screen overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Loading portfolio data...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error || !fundData || !userData) {
    return (
      <div className="h-screen overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-xl border border-red-500/20 p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">
            Unable to Load Dashboard
          </h2>
          <p className="text-slate-400 mb-4">
            {error ||
              "Failed to load portfolio data. Please check your connection and try again."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-bold py-2 px-6 rounded-lg transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Calculate user metrics
  const currentValue = userData.total_shares * fundData.current_nav_per_share;
  const totalGainLoss = currentValue - userData.cost_basis;
  const totalGainLossPercent = (totalGainLoss / userData.cost_basis) * 100;
  const ownershipPercent =
    (userData.total_shares / fundData.total_shares_outstanding) * 100;

  return (
    <div className="h-screen overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 relative">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(180,130,50,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(180,130,50,0.03)_1px,transparent_1px)] bg-[size:64px_64px]"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl"></div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Gold accent line */}
        <div className="h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent mb-6"></div>

        {/* Header */}
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-amber-500/20 p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <A11LogoBordered size={48} />
              <div className="h-12 w-px bg-slate-700"></div>
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full blur opacity-30"></div>
                <div className="relative">
                  <Blobbie address={account?.address || ""} size={48} />
                </div>
              </div>
              <div>
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="bg-slate-800/50 text-white px-3 py-1 rounded-lg border border-slate-700 focus:outline-none focus:border-amber-500"
                      placeholder="Enter your name"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveName}
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-900 font-semibold px-3 py-1 rounded-lg text-sm transition-all"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-white tracking-tight">
                      {userName}
                    </h1>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-slate-400 hover:text-amber-500 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-slate-400 font-mono text-sm">
                    {formatAddress(account?.address || "")}
                  </p>
                  <button
                    onClick={copyAddress}
                    className="text-slate-400 hover:text-amber-500 transition-colors"
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              className="bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-amber-500/30 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Disconnect
            </button>
          </div>
        </div>

        {/* Fund Statistics Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* AUM and Performance */}
          <div className="lg:col-span-2 bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-xl border border-amber-500/20 p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-slate-400 text-sm mb-1">Total AUM</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(fundData.total_aum)}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">NAV/Share</p>
                <p className="text-2xl font-bold text-white">
                  ${formatNumber(fundData.current_nav_per_share)}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">MTD Performance</p>
                <p
                  className={`text-2xl font-bold ${
                    fundData.performance_mtd >= 0
                      ? "text-emerald-500"
                      : "text-red-500"
                  } flex items-center gap-1`}
                >
                  {fundData.performance_mtd >= 0 ? (
                    <TrendingUp className="w-5 h-5" />
                  ) : (
                    <TrendingDown className="w-5 h-5" />
                  )}
                  {formatNumber(fundData.performance_mtd, 2)}%
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">YTD Performance</p>
                <p
                  className={`text-2xl font-bold ${
                    fundData.performance_ytd >= 0
                      ? "text-emerald-500"
                      : "text-red-500"
                  } flex items-center gap-1`}
                >
                  {fundData.performance_ytd >= 0 ? (
                    <TrendingUp className="w-5 h-5" />
                  ) : (
                    <TrendingDown className="w-5 h-5" />
                  )}
                  {formatNumber(fundData.performance_ytd, 2)}%
                </p>
              </div>
            </div>
          </div>

          {/* Portfolio Allocation Pie Chart */}
          <div className="bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-xl border border-amber-500/20 p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-amber-500" />
              Asset Allocation
            </h3>
            {portfolioData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={150}>
                  <RePieChart>
                    <Pie
                      data={portfolioData.map((asset) => ({
                        name: asset.asset_symbol,
                        value: asset.weight_percentage,
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {portfolioData.map((index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number | undefined) => value ? `$${value.toFixed(2)}` : 'N/A'}
                    />
                  </RePieChart>
                </ResponsiveContainer>
                <div className="flex justify-around mt-4">
                  {portfolioData.map((asset, index) => (
                    <div key={asset.asset_symbol} className="text-center">
                      <div className="flex items-center gap-1 justify-center mb-1">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        ></div>
                        <p className="text-slate-400 text-xs">
                          {asset.asset_symbol}
                        </p>
                      </div>
                      <p className="text-white font-semibold text-sm">
                        {formatNumber(asset.weight_percentage, 1)}%
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[150px] flex items-center justify-center">
                <p className="text-slate-500 text-sm">No portfolio data</p>
              </div>
            )}
          </div>
        </div>

        {/* User Portfolio Value */}
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-xl border border-amber-500/20 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-slate-400 text-sm mb-1">
                Your Portfolio Value
              </p>
              <p className="text-3xl font-bold text-white">
                {formatCurrency(currentValue)}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Total Gain/Loss</p>
              <p
                className={`text-2xl font-bold ${
                  totalGainLoss >= 0 ? "text-emerald-500" : "text-red-500"
                }`}
              >
                {formatCurrency(totalGainLoss)} (
                {formatNumber(totalGainLossPercent, 2)}%)
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Your Shares</p>
              <p className="text-2xl font-bold text-white">
                {formatNumber(userData.total_shares, 8)}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Fund Ownership</p>
              <p className="text-2xl font-bold text-white">
                {formatNumber(ownershipPercent, 4)}%
              </p>
            </div>
          </div>
        </div>

        {/* Main Content - 2 Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Left Column - Performance Chart & Portfolio Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance Chart */}
            <div className="bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-xl border border-amber-500/20 p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-500" />
                30-Day Performance
              </h3>
              {performanceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                    <XAxis
                      dataKey="date"
                      stroke="#94a3b8"
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                    />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e293b",
                        border: "1px solid #475569",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number | undefined) => value ? `$${value.toFixed(2)}` : 'N/A'}
                      labelFormatter={(label) => {
                        const date = new Date(label);
                        return date.toLocaleDateString();
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="nav_per_share"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center">
                  <p className="text-slate-500">
                    No performance data available
                  </p>
                </div>
              )}
            </div>

            {/* Enhanced Performance Metrics */}
            <div className="bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-xl border border-amber-500/20 p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                Performance Metrics
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-1">Sharpe Ratio</p>
                  <p className="text-xl font-bold text-white">
                    {formatNumber(fundData.sharpe_ratio || 0, 2)}
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-1">Max Drawdown</p>
                  <p className="text-xl font-bold text-red-500">
                    {formatNumber(fundData.max_drawdown || 0, 2)}%
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-1">Volatility</p>
                  <p className="text-xl font-bold text-white">
                    {formatNumber(fundData.volatility || 0, 2)}%
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-1">All-Time High</p>
                  <p className="text-xl font-bold text-emerald-500">
                    ${formatNumber(fundData.all_time_high_nav || 0)}
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-1">All-Time Low</p>
                  <p className="text-xl font-bold text-slate-400">
                    ${formatNumber(fundData.all_time_low_nav || 0)}
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-1">Cost Basis</p>
                  <p className="text-xl font-bold text-white">
                    ${formatNumber(userData.cost_basis / userData.total_shares)}
                  </p>
                </div>
              </div>
            </div>

            {/* Expanded Portfolio Breakdown */}
            <div className="bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-xl border border-amber-500/20 p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                Portfolio Holdings
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-2 text-slate-400 text-sm font-semibold">
                        Asset
                      </th>
                      <th className="text-right py-3 px-2 text-slate-400 text-sm font-semibold">
                        Quantity
                      </th>
                      <th className="text-right py-3 px-2 text-slate-400 text-sm font-semibold">
                        Price
                      </th>
                      <th className="text-right py-3 px-2 text-slate-400 text-sm font-semibold">
                        Value
                      </th>
                      <th className="text-right py-3 px-2 text-slate-400 text-sm font-semibold">
                        24h
                      </th>
                      <th className="text-right py-3 px-2 text-slate-400 text-sm font-semibold">
                        P&L
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolioData.length > 0 ? (
                      portfolioData.map((asset) => (
                        <tr
                          key={asset.asset_symbol}
                          className="border-b border-slate-800 hover:bg-slate-800/30"
                        >
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                                <span className="text-amber-500 font-bold text-xs">
                                  {asset.asset_symbol}
                                </span>
                              </div>
                              <span className="text-white font-semibold">
                                {asset.asset_name}
                              </span>
                            </div>
                          </td>
                          <td className="text-right py-3 px-2 text-white">
                            {formatNumber(
                              asset.quantity,
                              asset.asset_symbol === "USD" ? 2 : 4
                            )}
                          </td>
                          <td className="text-right py-3 px-2 text-white">
                            ${formatNumber(asset.current_price)}
                          </td>
                          <td className="text-right py-3 px-2 text-white font-semibold">
                            {formatCurrency(asset.current_value)}
                          </td>
                          <td className="text-right py-3 px-2">
                            <span
                              className={`${
                                asset.price_change_24h >= 0
                                  ? "text-emerald-500"
                                  : "text-red-500"
                              } font-semibold`}
                            >
                              {asset.price_change_24h >= 0 ? "+" : ""}
                              {formatNumber(asset.price_change_24h || 0, 2)}%
                            </span>
                          </td>
                          <td className="text-right py-3 px-2">
                            <span
                              className={`${
                                asset.unrealized_pnl_percentage >= 0
                                  ? "text-emerald-500"
                                  : "text-red-500"
                              } font-semibold`}
                            >
                              {asset.unrealized_pnl_percentage >= 0 ? "+" : ""}
                              {formatNumber(
                                asset.unrealized_pnl_percentage || 0,
                                2
                              )}
                              %
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-8 text-center text-slate-500"
                        >
                          No portfolio holdings available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column - Actions & Share Info */}
          <div className="space-y-6">
            {/* Quick Actions - Mint/Redeem */}
            <div className="bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-xl border border-amber-500/20 p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-500" />
                Quick Actions
              </h3>

              {/* Mint Shares */}
              <div className="mb-6">
                <label className="text-slate-400 text-sm mb-2 block">
                  Mint New Shares
                </label>
                <input
                  type="number"
                  placeholder="Amount in USD"
                  value={mintAmount}
                  onChange={(e) => setMintAmount(e.target.value)}
                  className="w-full bg-slate-800/50 text-white px-4 py-3 rounded-lg border border-slate-700 focus:outline-none focus:border-amber-500 mb-2"
                />
                {mintAmount && (
                  <p className="text-slate-400 text-sm mb-2">
                    You will receive:{" "}
                    {formatNumber(
                      parseFloat(mintAmount) / fundData.current_nav_per_share,
                      4
                    )}{" "}
                    shares
                  </p>
                )}
                <button className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-3 rounded-lg transition-all">
                  Mint Shares
                </button>
              </div>

              {/* Redeem Shares */}
              <div>
                <label className="text-slate-400 text-sm mb-2 block">
                  Redeem Shares
                </label>
                <input
                  type="number"
                  placeholder="Number of shares"
                  value={redeemAmount}
                  onChange={(e) => setRedeemAmount(e.target.value)}
                  className="w-full bg-slate-800/50 text-white px-4 py-3 rounded-lg border border-slate-700 focus:outline-none focus:border-amber-500 mb-2"
                />
                {redeemAmount && (
                  <p className="text-slate-400 text-sm mb-2">
                    You will receive:{" "}
                    {formatCurrency(
                      parseFloat(redeemAmount) * fundData.current_nav_per_share
                    )}
                  </p>
                )}
                <button className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 rounded-lg transition-all">
                  Redeem Shares
                </button>
              </div>
            </div>

            {/* Share Information */}
            <div className="bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-xl border border-amber-500/20 p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-500" />
                Share Information
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                  <span className="text-slate-400 text-sm">Your Shares</span>
                  <span className="text-white font-semibold">
                    {formatNumber(userData.total_shares, 8)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                  <span className="text-slate-400 text-sm">Current NAV</span>
                  <span className="text-white font-semibold">
                    ${formatNumber(fundData.current_nav_per_share)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                  <span className="text-slate-400 text-sm">
                    Investment Value
                  </span>
                  <span className="text-white font-semibold">
                    {formatCurrency(currentValue)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                  <span className="text-slate-400 text-sm">Cost Basis</span>
                  <span className="text-white font-semibold">
                    {formatCurrency(userData.cost_basis)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                  <span className="text-slate-400 text-sm">Unrealized P&L</span>
                  <span
                    className={`font-semibold ${
                      totalGainLoss >= 0 ? "text-emerald-500" : "text-red-500"
                    }`}
                  >
                    {formatCurrency(totalGainLoss)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-700/50">
                  <span className="text-slate-400 text-sm">P&L Percentage</span>
                  <span
                    className={`font-semibold ${
                      totalGainLossPercent >= 0
                        ? "text-emerald-500"
                        : "text-red-500"
                    }`}
                  >
                    {formatNumber(totalGainLossPercent, 2)}%
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-400 text-sm">Fund Ownership</span>
                  <span className="text-white font-semibold">
                    {formatNumber(ownershipPercent, 4)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Market Data Widget */}
            <div className="bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-xl border border-amber-500/20 p-6">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-500" />
                Market Data
              </h3>
              <div className="space-y-4">
                {marketData.length > 0 ? (
                  marketData.map((asset) => (
                    <div
                      key={asset.asset_symbol}
                      className="bg-slate-800/50 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-bold">
                          {asset.asset_symbol}
                        </span>
                        <span
                          className={`text-sm font-semibold ${
                            asset.price_change_24h >= 0
                              ? "text-emerald-500"
                              : "text-red-500"
                          }`}
                        >
                          {asset.price_change_24h >= 0 ? "+" : ""}
                          {formatNumber(asset.price_change_24h || 0, 2)}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-slate-400 text-xs">Price</span>
                        <span className="text-white font-semibold">
                          ${formatNumber(asset.current_price)}
                        </span>
                      </div>
                      {asset.volume_24h && (
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-slate-400 text-xs">
                            24h Volume
                          </span>
                          <span className="text-slate-300 text-sm">
                            ${(asset.volume_24h / 1e9).toFixed(2)}B
                          </span>
                        </div>
                      )}
                      {asset.market_cap && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-xs">
                            Market Cap
                          </span>
                          <span className="text-slate-300 text-sm">
                            ${(asset.market_cap / 1e9).toFixed(2)}B
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="bg-slate-800/50 rounded-lg p-4 text-center">
                    <p className="text-slate-500 text-sm">
                      No market data available
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-xl border border-amber-500/20 p-6 mb-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-500" />
            Transaction History
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-2 text-slate-400 text-sm font-semibold">
                    Date
                  </th>
                  <th className="text-left py-3 px-2 text-slate-400 text-sm font-semibold">
                    Type
                  </th>
                  <th className="text-right py-3 px-2 text-slate-400 text-sm font-semibold">
                    Shares
                  </th>
                  <th className="text-right py-3 px-2 text-slate-400 text-sm font-semibold">
                    Price
                  </th>
                  <th className="text-right py-3 px-2 text-slate-400 text-sm font-semibold">
                    Total Value
                  </th>
                  <th className="text-center py-3 px-2 text-slate-400 text-sm font-semibold">
                    Status
                  </th>
                  <th className="text-center py-3 px-2 text-slate-400 text-sm font-semibold">
                    Tx Hash
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.length > 0 ? (
                  transactions.map((tx, index) => (
                    <tr
                      key={index}
                      className="border-b border-slate-800 hover:bg-slate-800/30"
                    >
                      <td className="py-3 px-2 text-slate-300">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            tx.transaction_type === "MINT"
                              ? "bg-emerald-500/20 text-emerald-500"
                              : tx.transaction_type === "REDEEM"
                              ? "bg-red-500/20 text-red-500"
                              : "bg-blue-500/20 text-blue-500"
                          }`}
                        >
                          {tx.transaction_type}
                        </span>
                      </td>
                      <td className="text-right py-3 px-2 text-white">
                        {formatNumber(tx.share_quantity, 2)}
                      </td>
                      <td className="text-right py-3 px-2 text-white">
                        ${formatNumber(tx.share_price)}
                      </td>
                      <td className="text-right py-3 px-2 text-white font-semibold">
                        {formatCurrency(tx.total_usd_value)}
                      </td>
                      <td className="text-center py-3 px-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            tx.status === "CONFIRMED"
                              ? "bg-emerald-500/20 text-emerald-500"
                              : tx.status === "FAILED"
                              ? "bg-red-500/20 text-red-500"
                              : "bg-amber-500/20 text-amber-500"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="text-center py-3 px-2">
                        {tx.transaction_hash ? (
                          <a
                            href={`https://etherscan.io/tx/${tx.transaction_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-500 hover:text-amber-400 flex items-center justify-center gap-1"
                          >
                            <span className="font-mono text-sm">
                              {tx.transaction_hash.slice(0, 10)}...
                            </span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-500 text-sm">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No transactions yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fund Activity Feed */}
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-xl border border-amber-500/20 p-6 mb-6">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            Fund Activity
          </h3>
          <div className="space-y-3">
            {activities.length > 0 ? (
              activities.map((activity, index) => (
                <div
                  key={index}
                  className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 hover:border-amber-500/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            activity.activity_type === "TRADE"
                              ? "bg-blue-500/20 text-blue-400"
                              : activity.activity_type === "REBALANCE"
                              ? "bg-purple-500/20 text-purple-400"
                              : activity.activity_type === "DISTRIBUTION"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-amber-500/20 text-amber-400"
                          }`}
                        >
                          {activity.activity_type}
                        </span>
                        <span className="text-slate-500 text-xs">
                          {new Date(activity.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-300 text-sm">
                        {activity.description}
                      </p>
                    </div>
                    {activity.amount && (
                      <div className="text-right">
                        <p className="text-white font-semibold">
                          {formatCurrency(activity.amount)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-slate-800/50 rounded-lg p-8 text-center">
                <p className="text-slate-500">No recent fund activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom gold accent line */}
        <div className="h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent mt-6"></div>
      </div>
    </div>
  );
};

export default Dashboard;
