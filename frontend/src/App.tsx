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
  createWallet("app.phantom"),
  createWallet("com.coinbase.wallet")
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
        console.log('Account details:', account);
        
        // Try to extract user info from the account
        // ThirdWeb stores authentication details in the account object
        let authMethod = 'wallet'; // default
        let email = null;
        let phoneNumber = null;
        let displayName = 'Web3 User';
        let profileImage = null;
        let socialId = null;

        // Check if this is an in-app wallet with social/email login
        // The account object may contain details about how the user authenticated
        if (account && 'details' in account) {
          const details = (account as any).details;
          console.log('Account details object:', details);
          
          // Try to extract authentication method
          if (details?.authMethod) {
            authMethod = details.authMethod;
          } else if (details?.type) {
            authMethod = details.type;
          }
          
          // Extract email if available
          if (details?.email) {
            email = details.email;
            if (authMethod === 'wallet') authMethod = 'email';
          }
          
          // Extract phone if available
          if (details?.phoneNumber || details?.phone) {
            phoneNumber = details.phoneNumber || details.phone;
            if (authMethod === 'wallet') authMethod = 'phone';
          }
          
          // Extract display name if available
          if (details?.name || details?.displayName) {
            displayName = details.name || details.displayName;
          }
          
          // Extract profile image if available
          if (details?.profilePicture || details?.picture || details?.avatar) {
            profileImage = details.profilePicture || details.picture || details.avatar;
          }
          
          // Extract social IDs
          if (details?.sub || details?.id) {
            socialId = details.sub || details.id;
          }
        }

        console.log('Extracted user info:', {
          authMethod,
          email,
          phoneNumber,
          displayName,
          profileImage,
          socialId
        });
        
        // First check if user exists
        const checkResponse = await fetch(`${API_URL}/api/user/${account.address}`);
        
        if (checkResponse.status === 404) {
          // User doesn't exist, create new user
          console.log('User not found, creating new user...');
          
          const userData: any = {
            walletAddress: account.address,
            authMethod: authMethod,
            displayName: displayName,
            email: email || null,
            phoneNumber: phoneNumber || null,
            profileImage: profileImage || null,
          };

          // Add social ID based on auth method
          if (socialId) {
            if (authMethod === 'google') {
              userData.googleId = socialId;
            } else if (authMethod === 'apple') {
              userData.appleId = socialId;
            } else if (authMethod === 'facebook') {
              userData.facebookId = socialId;
            }
          }

          console.log('Sending user data:', userData);

          const response = await fetch(`${API_URL}/api/user/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
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
          // User exists, update last login
          console.log('User already exists in database, updating login info...');
          
          const updateData: any = {
            walletAddress: account.address,
            authMethod: authMethod,
            lastLogin: true, // Flag to update last_login_at
          };

          // Only update fields that have values
          if (email) updateData.email = email;
          if (phoneNumber) updateData.phoneNumber = phoneNumber;
          if (displayName && displayName !== 'Web3 User') updateData.displayName = displayName;
          if (profileImage) updateData.profileImage = profileImage;

          await fetch(`${API_URL}/api/user/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
          });
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