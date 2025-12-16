import { ConnectButton } from "thirdweb/react";
import { Wallet, Mail, AtSign, Gamepad2 } from 'lucide-react';
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
            <p className="text-gray-300">Choose your preferred login method</p>
          </div>

          {/* Login Options Info */}
          <div className="space-y-4 mb-6">
            <div className="bg-white/5 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-purple-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Wallet className="w-4 h-4 text-purple-300" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Crypto Wallets</h3>
                  <p className="text-gray-400 text-sm">MetaMask, Coinbase, WalletConnect</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-blue-300" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Email & Phone</h3>
                  <p className="text-gray-400 text-sm">Sign in with email or phone number</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <AtSign className="w-4 h-4 text-green-300" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Social Login</h3>
                  <p className="text-gray-400 text-sm">Google, X, Facebook</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-orange-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Gamepad2 className="w-4 h-4 text-orange-300" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Gaming & Community</h3>
                  <p className="text-gray-400 text-sm">Twitch, Discord</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-indigo-500/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <div className="w-4 h-4 text-indigo-300" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">Developer</h3>
                  <p className="text-gray-400 text-sm">GitHub, Passkey</p>
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
          <div className="mt-6 pt-6 border-t border-white/10">
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