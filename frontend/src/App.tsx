import { 
  ThirdwebProvider,
  useActiveAccount,
  useActiveWalletConnectionStatus,
} from "thirdweb/react";
import { createThirdwebClient } from "thirdweb";
import { inAppWallet, createWallet } from "thirdweb/wallets";
import { useEffect } from 'react';

import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';

// Create thirdweb client
const client = createThirdwebClient({
  clientId: import.meta.env.VITE_THIRDWEB_CLIENT_ID,
});

// Configure in-app wallet with email and social login options
const wallets = [
  inAppWallet({
    auth: {
      options: [
        "email",
        "google",
        "coinbase",
        "facebook",
        "x",
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

// Remove trailing slash from API_URL to prevent double slashes
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

function AppContent() {
  const account = useActiveAccount();
  const connectionStatus = useActiveWalletConnectionStatus();

  useEffect(() => {
    const registerUser = async () => {
      if (!account?.address) return;

      try {
        console.log('Registering user with address:', account.address);
        
        // First check if user exists
        const checkResponse = await fetch(`${API_URL}/api/user/${account.address}`);
        
        if (checkResponse.status === 404) {
          // User doesn't exist, create new user
          console.log('User not found, creating new user...');
          
          const response = await fetch(`${API_URL}/api/user/signup`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              walletAddress: account.address,
              authMethod: 'wallet',
              displayName: 'Web3 User',
              email: "",
              profileImage: "",
            }),
          });

          if (response.ok) {
            const data = await response.json();
            console.log('User created successfully:', data);
          } else if (response.status === 409) {
            // User already exists, this is fine
            console.log('User already exists');
          } else {
            const error = await response.json();
            console.error('Failed to create user:', error);
          }
        } else if (checkResponse.ok) {
          // User exists, optionally update last login
          console.log('User already exists in database');
        }
      } catch (error) {
        console.error('Error registering user:', error);
      }
    };

    if (connectionStatus === 'connected' && account?.address) {
      registerUser();
    }
  }, [account?.address, connectionStatus]);

  return account ? <Dashboard client={client} /> : <LoginPage client={client} wallets={wallets} />;
}

function App() {
  return (
    <ThirdwebProvider>
      <AppContent />
    </ThirdwebProvider>
  );
}

export default App;