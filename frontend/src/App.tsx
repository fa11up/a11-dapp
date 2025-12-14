import { 
  ThirdwebProvider, 
  useAddress,
  metamaskWallet,
  coinbaseWallet,
  walletConnect,
  embeddedWallet,
} from "@thirdweb-dev/react";

import LoginPage from './components/LoginPage';
import Dashboard from './components/Dashboard';

function AppContent() {
  const address = useAddress();
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