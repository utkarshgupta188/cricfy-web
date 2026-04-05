# 🚀 CricfyTV Web Premium 2.0

A high-fidelity, cinematic web interface for live TV streaming, meticulously crafted for a premium user experience.

![Premium UI Preview](https://img.shields.io/badge/UI-Premium_2.0-blueviolet?style=for-the-badge)
![Tech Stack](https://img.shields.io/badge/Stack-Vite_%2B_React_%2B_Express-blue?style=for-the-badge)

## ✨ Cinematic Features

### 🌌 Aurora Atmosphere
Experience a living interface with our **Aurora Animated Background**. Shifting radial gradients create a deep, atmospheric depth that evolves as you navigate.

### 💎 Glassmorphism 2.0
Every component is built with a refined **glass-premium** utility, featuring:
- Multi-layered backdrop blurs.
- Specular inner highlights.
- Ambient radial glows on interaction.

### 🍱 Cinematic Grid & Navigation
- **Horizontal Genre Ribbon**: Effortlessly filter channels by category with a smooth-scrolling, high-contrast navigation bar.
- **Logo-First Cards**: Redesigned channel cards that prioritize branding, featuring hover-activated play overlays and magnetic 3D tilt effects.

### 📺 Pro Player Experience
- **Ambilight Halo**: A dynamic ambient glow that mirrors the player's presence for total immersion.
- **Integrated DRM**: Seamless support for ClearKey and license-protected streams via Shaka Player.
- **Unified Controls**: Custom-anchored Shaka UI and technical metadata grids.

---

## 🛠 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- [npm](https://www.npmjs.com/)

### 2. Installation
Clone the repository and install the dependencies for both the frontend and proxy backend.
```bash
cd cricfy-web
npm install
```

### 3. Development
Launch the entire ecosystem (Frontend + Backend Proxy) with a single command:
```bash
npm run dev:all
```
*   **Frontend**: [http://localhost:5173](http://localhost:5173)
*   **Backend Proxy**: [http://localhost:3001](http://localhost:3001)

---

## 🏛 Architecture

- **Frontend**: Vite + React for lightning-fast HMR and performance.
- **Backend API**: Express server acting as a robust proxy for streaming segments, cookies, and DRM headers.
- **Styling**: Vanilla CSS with modern custom properties and hardware-accelerated animations.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
