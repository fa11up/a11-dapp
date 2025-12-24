# A11 Investment Group - Digital Asset Management Platform

A premium Web3 authentication and digital asset management platform featuring institutional-grade security and multiple authentication methods.

## Features

- **Multiple Authentication Methods**
  - Hardware wallets (MetaMask, Coinbase, WalletConnect)
  - Email & Phone verification
  - Social login (Google, GitHub, Microsoft, Discord, X)
  - Biometric options (Passkey)
  - Guest access

- **Institutional-Grade Security**
  - Bank-level encryption
  - Multi-factor authentication
  - SOC 2 Type II certified infrastructure
  - Secure wallet custody

- **Modern UI/UX**
  - Executive Suite design aesthetic
  - Responsive layout (mobile & desktop)
  - Smooth animations and transitions
  - Dark theme with gold accents

- **User Management**
  - Custom display names
  - Wallet address management
  - Transaction history tracking
  - Account settings

## Tech Stack

**Frontend:**
- React 18
- TypeScript
- Vite
- Thirdweb SDK v5
- TailwindCSS
- Lucide React (icons)

**Backend:**
- Node.js/Express (assumed from API calls)
- User authentication & management

## Prerequisites

- Node.js 16+ and npm/yarn
- Thirdweb Client ID ([Get one here](https://thirdweb.com/dashboard))
- Backend API running (see API configuration)

## Installation

1. **Clone the repository**
```bash
   git clone <repository-url>
   cd a11-investment-group
```

2. **Install dependencies**
```bash
   cd frontend
   npm install
```

3. **Configure environment variables**
   
   Create a `.env` file in the `frontend` directory:
```env
   VITE_THIRDWEB_CLIENT_ID=your_thirdweb_client_id_here
   VITE_API_URL=http://localhost:3001
```

4. **Start the development server**
```bash
   npm run dev
```

## Project Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── A11LogoBordered.tsx      # Primary logo component
│   │   ├── SplashPage.tsx           # Landing/splash screen
│   │   ├── LoginPage.tsx            # Authentication portal
│   │   └── Dashboard.tsx            # Main user dashboard
│   ├── App.tsx                      # Main app component & routing
│   ├── main.tsx                     # App entry point
│   └── index.css                    # Global styles
└── package.json
```

## Design System

**Color Palette:**
- Primary: Slate (900, 800, 700)
- Accent: Amber/Gold (500, 600)
- Success: Emerald (500)
- Text: White, Slate (300-500)

**Typography:**
- Headings: Bold, tight tracking
- Body: Regular, relaxed leading
- Monospace: Wallet addresses

**Components:**
- Glass morphism effects (`backdrop-blur`)
- Gradient borders and buttons
- Subtle grid pattern overlays
- Ambient glow effects

## Key Features Explained

### Three-Page Flow
1. **SplashPage** - Introduction to A11 Investment Group with branding and call-to-action
2. **LoginPage** - Secure authentication portal with multiple login methods
3. **Dashboard** - User portfolio management and account details

### Authentication Flow
- Detects wallet connection via Thirdweb
- Checks if user exists in backend
- Creates new user or updates login timestamp
- Tracks authentication method used

### User Experience
- Persistent user names (localStorage)
- Copy-to-clipboard for addresses
- Visual feedback for all interactions
- Responsive design for all screen sizes

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_THIRDWEB_CLIENT_ID` | Your Thirdweb client ID | Yes |
| `VITE_API_URL` | Backend API endpoint | Yes |

## API Endpoints

The frontend expects the following backend endpoints:

- `GET /api/user/:address` - Check if user exists
- `POST /api/user/signup` - Create new user
- `POST /api/user/login` - Update login timestamp

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Development

**Run development server:**
```bash
npm run dev
```

**Build for production:**
```bash
npm run build
```

**Preview production build:**
```bash
npm run preview
```

## Customization

### Adjusting Colors
Modify Tailwind colors in the components by replacing:
- `amber-*` classes for accent colors
- `slate-*` classes for backgrounds
- `emerald-*` classes for success states

## Security Considerations

- Never commit `.env` files
- Rotate API keys regularly
- Use HTTPS in production
- Implement rate limiting on backend
- Validate all user inputs

## Support

For issues or questions, please contact the development team.

## License

Proprietary - A11 Investment Group

---

**Built with ❤️ by the A11 team**
