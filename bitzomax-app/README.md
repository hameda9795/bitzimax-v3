# BITZOMAX - Cyberpunk Video Subscription Platform

A cutting-edge video subscription platform featuring a distinctive cyberpunk aesthetic with neon elements, futuristic UI, and terminal-style typography.

## Features

- **Cyberpunk Design Theme**: 
  - Neon green (#00ff9f)
  - Hot pink/magenta (#ff0080)
  - Electric blue (#00e1ff)
  - Deep purple-black backgrounds (#0a0014)
  - Neon glows, grid patterns, and futuristic UI elements

- **Subscription Model**:
  - Free users can only watch the first 30 seconds of each video
  - Premium subscription for only €6/month
  - Subscription management in user profile
  - Cancel subscription anytime

- **Video Features**:
  - Instagram-style like button for each video
  - 9:16 aspect ratio similar to Instagram reels
  - Video preview for free users (30 seconds)
  - Related video recommendations

- **User Profile**:
  - Subscription management
  - Favorite videos collection
  - Profile customization options

## Technology Stack

- **Frontend**: Angular 19 with TailwindCSS
- **Styling**: SCSS + TailwindCSS for responsive design
- **Routing**: Angular Router with lazy loading
- **State Management**: Angular services with RxJS

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm (v9+)

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm start
```

Navigate to `http://localhost:4200/` to view the application.

## Project Structure

```
src/
├── app/
│   ├── core/                # Core functionality 
│   │   ├── header/          # Site header
│   │   ├── footer/          # Site footer
│   │   └── services/        # Core services (subscription, user, video)
│   ├── features/            # Feature modules
│   │   ├── home/            # Home page with video listings
│   │   ├── video/           # Video player page 
│   │   └── profile/         # User profile & subscription management
│   └── shared/              # Shared components and modules
├── assets/                  # Static assets
│   ├── images/              # Images and icons
│   └── videos/              # Sample videos
└── styles.scss              # Global styles and TailwindCSS imports
```

## Cyberpunk Design Elements

- Terminal-style typography with 'Share Tech Mono' font
- Neon glow effects on buttons and UI elements
- Grid patterns in backgrounds
- Glitch text effect for headings
- High contrast color scheme with neon accents
- Futuristic UI components

## License

This project is for demonstration purposes only.
