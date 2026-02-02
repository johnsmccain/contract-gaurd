# ContractGuard 🛡️

> AI-Powered Smart Contract Security Analysis

ContractGuard democratizes smart contract security by leveraging Google Gemini AI to provide instant, comprehensive vulnerability analysis that's both technically accurate and human-readable.

## ✨ Features

- **🤖 AI-Powered Analysis** - Uses Google Gemini 2.0 Flash for sophisticated security reasoning
- **⚡ Instant Results** - Get comprehensive analysis in ~30 seconds vs weeks for traditional audits
- **📱 Mobile-First Design** - Fully responsive with dedicated mobile navigation
- **🎯 Exploit Narratives** - Story-driven attack scenarios from attacker's perspective
- **♿ Accessibility-First** - WCAG compliant with screen reader support
- **🎨 Modern UI/UX** - Glassmorphism design with smooth animations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Google Gemini API key ([Get one here](https://ai.google.dev/))

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd contract-guard

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and enter your Gemini API key to start analyzing contracts.

## 🏗️ Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Animations**: Framer Motion
- **AI**: Google Gemini 2.0 Flash
- **Icons**: Lucide React

## 📊 Analysis Features

### Risk Assessment
- **Overall Risk Score** (0-10 scale)
- **Severity Classification** (Critical, High, Medium, Low)
- **Weighted Scoring Algorithm**
- **Visual Risk Gauge**

### Security Findings
- **Vulnerability Detection** across 5 categories:
  - Access Control
  - Fund Security  
  - Logic Errors
  - External Calls
  - Upgradeability
- **Detailed Explanations** in plain language
- **Mitigation Recommendations**
- **Affected Code Snippets**

### Exploit Narratives
- **Attack Scenarios** from attacker perspective
- **Step-by-step Execution** plans
- **Impact Assessment** with estimated damage
- **Probability Ratings**

## 🎨 UI Improvements

### Recent Enhancements
- ✅ Fixed invalid Tailwind CSS classes
- ✅ Enhanced accessibility (ARIA labels, keyboard navigation)
- ✅ Mobile-responsive design with dedicated navigation
- ✅ Performance optimizations (useMemo, useCallback)
- ✅ Error boundaries for graceful error handling
- ✅ Toast notification system
- ✅ Loading skeleton components

### Design System
- **Colors**: Custom primary (#00ff9d) and secondary (#00b8ff) palette
- **Typography**: Inter + Outfit fonts with JetBrains Mono for code
- **Animations**: Smooth transitions with Framer Motion
- **Glassmorphism**: Modern glass panel effects

## 🔧 Development

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

### Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Main page
├── components/         # React components
│   ├── AnalysisLoader.tsx
│   ├── ContractInput.tsx
│   ├── ErrorBoundary.tsx
│   ├── FindingsList.tsx
│   ├── MobileNav.tsx
│   ├── RiskSummary.tsx
│   └── Toast.tsx
└── lib/               # Utilities
    ├── gemini.ts      # AI integration
    ├── types.ts       # TypeScript types
    └── contract-parser.ts
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

ContractGuard is for educational purposes and preliminary analysis. It should not replace professional security audits for production contracts handling significant value.

## 🙏 Acknowledgments

- [Google Gemini](https://ai.google.dev/) - AI capabilities
- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Framer Motion](https://www.framer.com/motion/) - Animations
- Web3 Security Community - Vulnerability research

---

**Built with ❤️ for the Web3 community**