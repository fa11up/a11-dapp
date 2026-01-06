import {
  ThirdwebProvider,
  useActiveAccount,
  useActiveWallet,
  useActiveWalletConnectionStatus,
} from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import React, { useEffect, useState } from 'react';

import SplashPage from './components/SplashPage';
import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';

const client = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID,
});

const wallets = [
  inAppWallet({
    auth: {
      options: [
        "guest",
        "email",
        "google",
        "x",
        "coinbase",
        "facebook",
        "github",
        "twitch",
        "discord",
        "phone",
        "passkey",
      ],
    },
  }),
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("walletConnect"),
];

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

function AppContent() : React.ReactElement {
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const connectionStatus = useActiveWalletConnectionStatus();
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastProcessedAddress, setLastProcessedAddress] = useState<string | null>(null);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const handleUserAuthentication = async () => {
      if (connectionStatus !== 'connected' || !wallet || !account?.address) {
        return;
      }

      if (isProcessing || lastProcessedAddress === account.address) {
        return;
      }

      setIsProcessing(true);
      
      try {
        console.log('🔐 User connected with address:', account.address);
        console.log('👛 Wallet ID:', wallet.id);

        // Detect auth method based on wallet ID
        let authMethod = 'wallet';
        if (wallet.id === 'inApp' || wallet.id === 'embedded') {
          authMethod = 'inApp';
        } else if (wallet.id === 'io.metamask') {
          authMethod = 'metamask';
        } else if (wallet.id === 'com.coinbase.wallet') {
          authMethod = 'coinbase-wallet';
        } else if (wallet.id === 'walletConnect') {
          authMethod = 'walletconnect';
        }

        console.log('📊 Detected auth method:', authMethod);

        // Check if user exists
        const checkResponse = await fetch(`${API_URL}/api/user/${account.address}`);
        
        if (checkResponse.status === 404) {
          // NEW USER - SIGNUP
          console.log('✨ NEW USER - Creating account');
          
          const signupData = {
            walletAddress: account.address,
            authMethod: authMethod,
            displayName: 'family member',
            email: null,
            phoneNumber: null,
            profileImage: null,
          };

          console.log('📤 Signup data:', signupData);

          const signupResponse = await fetch(`${API_URL}/api/user/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(signupData),
          });

          if (signupResponse.ok) {
            const data = await signupResponse.json();
            console.log('✅ User created:', data);
          } else if (signupResponse.status === 409) {
            console.log('ℹ️ User already exists (race condition)');
          } else {
            const error = await signupResponse.json();
            console.error('❌ Signup failed:', error);
          }
        } else if (checkResponse.ok) {
          // EXISTING USER - LOGIN
          console.log('👋 EXISTING USER - Updating login');
          
          const loginData = {
            walletAddress: account.address,
            authMethod: authMethod,
          };

          console.log('📤 Login data:', loginData);

          const loginResponse = await fetch(`${API_URL}/api/user/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(loginData),
          });

          if (loginResponse.ok) {
            const data = await loginResponse.json();
            console.log('✅ Login tracked:', data);
          } else {
            const error = await loginResponse.json();
            console.error('❌ Login update failed:', error);
          }
        }

        setLastProcessedAddress(account.address);
      } catch (error) {
        console.error('💥 Authentication error:', error);
      } finally {
        setIsProcessing(false);
      }
    };

    handleUserAuthentication();
  }, [connectionStatus, wallet, account?.address, isProcessing, lastProcessedAddress]);

  useEffect(() => {
    if (connectionStatus === 'disconnected') {
      setLastProcessedAddress(null);
      setIsProcessing(false);
    }
  }, [connectionStatus]);

  const handleEnterPortal = (): void => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashPage onEnter={handleEnterPortal} />;
  }

  return account ? <Dashboard client={client} /> : <LoginPage client={client} wallets={wallets} />;
}

function App(): React.ReactElement {
  return (
    <ThirdwebProvider>
      <AppContent />
    </ThirdwebProvider>
  );
}

export default App;