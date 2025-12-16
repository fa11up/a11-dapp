import { ConnectButton } from "thirdweb/react";
import { Wallet, Mail, AtSign } from 'lucide-react';
import type { ThirdwebClient } from "thirdweb";
import type { Wallet as WalletType } from "thirdweb/wallets";

interface LoginPageProps {
  client: ThirdwebClient;
  wallets: WalletType[];
}

const LoginPage: React.FC<LoginPageProps> = ({ client, wallets }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black opacity-20"></div>
      
      <div className="relative z-10 max-w-md w-full">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mb-4">
              <Wallet className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Web3 Login</h1>
            <p className="text-gray-300">Connect with wallet or social account</p>
          </div>

          {/* Login Options Info */}
          <div className="space-y-6 mb-6">
            <div className="bg-white/5 rounded-lg p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Wallet className="w-4 h-4 text-purple-300" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Crypto Wallets</h3>
                  <p className="text-gray-400 text-sm">MetaMask, Phantom, Coinbase Wallet</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-blue-300" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Email & Phone</h3>
                  <p className="text-gray-400 text-sm">Sign in with your email or phone number</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AtSign className="w-4 h-4 text-green-300" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Social Login</h3>
                  <p className="text-gray-400 text-sm">Google, X, Facebook, Passkey</p>
                </div>
              </div>
            </div>
          </div>

          {/* ThirdWeb Connect Button */}
          <div className="flex justify-center">
            <ConnectButton
              client={client}
              wallets={wallets}
              theme="dark"
              connectButton={{
                label: "Connect Wallet",
              }}
              connectModal={{
                title: "Choose Login Method",
                size: "wide",
              }}
            />
          </div>

          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mt-6">
            <p className="text-blue-200 text-xs text-center">
              🔒 Secure authentication powered by ThirdWeb
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-center text-gray-400 text-xs">
              Powered by ThirdWeb SDK v5
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;