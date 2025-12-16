import { 
  ThirdwebProvider, 
  useAddress,
  useConnectionStatus,
  metamaskWallet,
  coinbaseWallet,
  walletConnect,
  embeddedWallet,
} from "@thirdweb-dev/react";
import { useEffect } from 'react';

import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';

// Remove trailing slash from API_URL to prevent double slashes
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/$/, '');

function AppContent() {
  const address = useAddress();
  const connectionStatus = useConnectionStatus();

  useEffect(() => {
    const registerUser = async () => {
      if (!address) return;

      try {
        console.log('Registering user with address:', address);
        
        // First check if user exists
        const checkResponse = await fetch(`${API_URL}/api/user/${address}`);
        
        if (checkResponse.status === 404) {
          // User doesn't exist, create new user
          console.log('User not found, creating new user...');
          
          const response = await fetch(`${API_URL}/api/user/signup`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              walletAddress: address,
              authMethod: 'wallet',
              displayName: 'Web3 User',
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
          
          // You can update the user here if needed
          await fetch(`${API_URL}/api/user`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              walletAddress: address,
              authMethod: 'wallet',
            }),
          });
        }
      } catch (error) {
        console.error('Error registering user:', error);
      }
    };

    if (connectionStatus === 'connected' && address) {
      registerUser();
    }
  }, [address, connectionStatus]);

  return address ? <Dashboard /> : <LoginPage />;
}

function App() {
  return (
    <ThirdwebProvider
      activeChain="ethereum"
      clientId={import.meta.env.VITE_THIRDWEB_CLIENT_ID}
      supportedWallets={[
        metamaskWallet(),
        coinbaseWallet(),
        walletConnect(),
        embeddedWallet({
          auth: {
            options: [
              "email",
              "google",
              "apple",
              "facebook",
            ],
          },
        }),
      ]}
    >
      <AppContent />
    </ThirdwebProvider>
  );
}

export default App;