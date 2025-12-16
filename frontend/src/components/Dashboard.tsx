import React, { useState, useEffect } from 'react';
import { useActiveAccount, useDisconnect, useWalletBalance,useActiveWallet } from "thirdweb/react";
import { LogOut, Wallet, TrendingUp, Activity, Settings, User, Copy, Check } from 'lucide-react';
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
        setUserName('Web3 User');
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
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="absolute inset-0 bg-black opacity-20"></div>
      
      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="bg-white/20 text-white px-3 py-1 rounded-lg border border-white/30 focus:outline-none focus:border-purple-400"
                      placeholder="Enter your name"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveName}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm transition-colors"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-white">
                      Welcome, {userName}!
                    </h1>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-gray-300 hover:text-white transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-gray-300 font-mono text-sm">
                    {formatAddress(account?.address || '')}
                  </p>
                  <button
                    onClick={copyAddress}
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Disconnect
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-300 font-semibold">Balance</h3>
              <Wallet className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-3xl font-bold text-white mb-1">
              {balance?.displayValue ? parseFloat(balance.displayValue).toFixed(4) : '0.00'}
            </p>
            <p className="text-sm text-gray-400">{balance?.symbol || 'ETH'}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-300 font-semibold">Activity</h3>
              <Activity className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-bold text-white mb-1">0</p>
            <p className="text-sm text-gray-400">Transactions</p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-300 font-semibold">Network</h3>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-3xl font-bold text-white mb-1">Ethereum</p>
            <p className="text-sm text-green-400">● Connected</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="bg-white/5 rounded-lg p-4 text-center">
                <p className="text-gray-400">No recent transactions</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button className="bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-white py-3 px-4 rounded-lg transition-colors">
                Send
              </button>
              <button className="bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-white py-3 px-4 rounded-lg transition-colors">
                Receive
              </button>
              <button className="bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-white py-3 px-4 rounded-lg transition-colors">
                Swap
              </button>
              <button className="bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 text-white py-3 px-4 rounded-lg transition-colors">
                Bridge
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl shadow-xl border border-white/20 p-6 mt-6">
          <h3 className="text-xl font-bold text-white mb-4">Account Details</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-white/10">
              <span className="text-gray-400">Full Address</span>
              <div className="flex items-center gap-2">
                <span className="text-white font-mono text-sm">{account?.address}</span>
                <button
                  onClick={copyAddress}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-white/10">
              <span className="text-gray-400">Wallet Type</span>
              <span className="text-white">In-App Wallet</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-400">Status</span>
              <span className="text-green-400 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                Connected
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;