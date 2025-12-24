import React, { useState, useEffect } from 'react';
import { useActiveAccount, useDisconnect, useWalletBalance, useActiveWallet, Blobbie } from "thirdweb/react";
import { LogOut, Wallet, TrendingUp, Activity, Settings, Copy, Check } from 'lucide-react';
import A11LogoBordered from './A11LogoBordered';
import { ethereum } from "thirdweb/chains";
import type { ThirdwebClient } from "thirdweb";

interface DashboardProps {
  client?: ThirdwebClient;
}

const Dashboard: React.FC<DashboardProps> = ({ client }) => {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const { disconnect } = useDisconnect();
  const { data: balance } = useWalletBalance({
    chain: ethereum,
    address: account?.address,
    client: client as ThirdwebClient,
  });
  
  const [userName, setUserName] = useState<string>('');
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (account?.address) {
      const savedName = localStorage.getItem(`userName_${account.address}`);
      if (savedName) {
        setUserName(savedName);
      } else {
        setUserName('family member');
      }
    }
  }, [account?.address]);

  const formatAddress = (addr: string): string => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 relative overflow-hidden">
      {/* Subtle grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(180,130,50,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(180,130,50,0.03)_1px,transparent_1px)] bg-[size:64px_64px]"></div>
      
      {/* Gradient orbs for depth */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Gold accent line */}
        <div className="h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent mb-6"></div>

        {/* Header Card */}
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-amber-500/20 p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full blur opacity-30"></div>
                <div className="relative">
                  <Blobbie address={account?.address || ''} size={64} />
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
                    <h1 className="text-2xl font-bold text-white tracking-tight">
                      Welcome, {userName}
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
                    {formatAddress(account?.address || '')}
                  </p>
                  <button
                    onClick={copyAddress}
                    className="text-slate-400 hover:text-amber-500 transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-xl border border-amber-500/20 p-6 hover:border-amber-500/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-400 font-semibold tracking-wide">PORTFOLIO BALANCE</h3>
              <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <Wallet className="w-5 h-5 text-amber-500" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-1">
              {balance?.displayValue ? parseFloat(balance.displayValue).toFixed(4) : '0.00'}
            </p>
            <p className="text-sm text-slate-500">{balance?.symbol || 'ETH'}</p>
          </div>

          <div className="bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-xl border border-amber-500/20 p-6 hover:border-amber-500/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-400 font-semibold tracking-wide">TOTAL ACTIVITY</h3>
              <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-amber-500" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-1">0</p>
            <p className="text-sm text-slate-500">Transactions</p>
          </div>

          <div className="bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-xl border border-amber-500/20 p-6 hover:border-amber-500/30 transition-all">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-slate-400 font-semibold tracking-wide">NETWORK STATUS</h3>
              <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-amber-500" />
              </div>
            </div>
            <p className="text-3xl font-bold text-white mb-1">Ethereum</p>
            <p className="text-sm text-emerald-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              Connected
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-xl border border-amber-500/20 p-6">
            <h3 className="text-xl font-bold text-white mb-4 tracking-tight">Recent Activity</h3>
            <div className="space-y-3">
              <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 text-center">
                <p className="text-slate-400">No recent transactions</p>
                <p className="text-slate-500 text-sm mt-1">Your transaction history will appear here</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-xl border border-amber-500/20 p-6">
            <h3 className="text-xl font-bold text-white mb-4 tracking-tight">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-amber-500/50 text-white py-4 px-4 rounded-lg transition-all duration-200 font-semibold">
                Send
              </button>
              <button className="bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-amber-500/50 text-white py-4 px-4 rounded-lg transition-all duration-200 font-semibold">
                Receive
              </button>
              <button className="bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-amber-500/50 text-white py-4 px-4 rounded-lg transition-all duration-200 font-semibold">
                Swap
              </button>
              <button className="bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700 hover:border-amber-500/50 text-white py-4 px-4 rounded-lg transition-all duration-200 font-semibold">
                Bridge
              </button>
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-xl border border-amber-500/20 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-amber-500/10 rounded-lg flex items-center justify-center">
               <A11LogoBordered size={48} />
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">Account Details</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-3 border-b border-slate-700/50">
              <span className="text-slate-400 tracking-wide">Full Address</span>
              <div className="flex items-center gap-2">
                <span className="text-white font-mono text-sm">{account?.address}</span>
                <button
                  onClick={copyAddress}
                  className="text-slate-400 hover:text-amber-500 transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-slate-700/50">
              <span className="text-slate-400 tracking-wide">Wallet Type</span>
              <span className="text-white">In-App Wallet</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-slate-400 tracking-wide">Connection Status</span>
              <span className="text-emerald-500 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Bottom gold accent line */}
        <div className="h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent mt-6"></div>
      </div>
    </div>
  );
};

export default Dashboard;