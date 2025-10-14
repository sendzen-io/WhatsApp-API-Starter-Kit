# WhatsApp API Starter Kit

A comprehensive starter kit for building WhatsApp Business API applications. This open-source suite provides all the essential tools, components, and examples needed to quickly build and deploy WhatsApp-powered applications.

## 🚀 Features

- **Complete Starter Kit**: Everything you need to build WhatsApp applications
- **Multiple Integrations**: API Playground, Embedded Signup, and Template Management
- **Production Ready**: Battle-tested components and configurations
- **Modular Architecture**: Use individual components or the complete suite
- **TypeScript Support**: Full type safety and IntelliSense support
- **Responsive Design**: Mobile-first approach with modern UI components
- **Documentation**: Comprehensive guides and examples
- **Community Support**: Active community and regular updates

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 with App Router
- **UI Framework**: React 19
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Language**: TypeScript
- **Package Manager**: pnpm
- **Build Tool**: Turbo
- **State Management**: Zustand
- **API Client**: Axios

## 📦 Installation

### Prerequisites

- Node.js >= 20
- pnpm >= 10.15.0

### Quick Start

```bash
# Clone the repository
git clone https://github.com/sendzen-io/whatsapp-api-starter-kit.git

# Navigate to the project directory
cd whatsapp-api-starter-kit

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

The application will be available at `http://localhost:3000`

## 🏗️ Project Structure

```
whatsapp-api-starter-kit/
├── apps/
│   ├── suite/                    # Main application
│   ├── api-playground/           # API testing interface
│   ├── embedded-setup/           # Embedded signup component
│   └── template-management/      # Template management system
├── packages/
│   ├── ui-core/                  # Core UI components
│   ├── ui-api-playground/        # API playground components
│   ├── ui-embedded-setup/        # Embedded setup components
│   ├── ui-template-management/   # Template management components
│   ├── ui-suite/                 # Suite-specific components
│   ├── typescript-config/        # Shared TypeScript configs
│   └── eslint-config/            # Shared ESLint configs
└── docs/                         # Documentation
```

## 🎯 What's Included

### 1. API Playground
Interactive interface for testing WhatsApp Business API endpoints:
- Message sending and receiving
- Template management
- Media upload/download
- Webhook testing
- Real-time API responses

### 2. Embedded Signup
Seamless onboarding component for WhatsApp Business API:
- Multi-step signup flow
- Phone number verification
- Business information collection
- API configuration setup
- Customizable UI themes

### 3. Template Management
Complete template management system:
- Create and edit message templates
- Template approval workflow
- Bulk template operations
- Template analytics
- Multi-language support

### 4. Core Components
Reusable UI components and utilities:
- Form components with validation
- Data tables and pagination
- Modal dialogs and notifications
- Loading states and error handling
- Theme system and dark mode

## 🚀 Getting Started

### Basic Setup

1. **Clone and Install**
```bash
git clone https://github.com/sendzen-io/whatsapp-api-starter-kit.git
cd whatsapp-api-starter-kit
pnpm install
```

2. **Environment Configuration**
```bash
# Copy environment template
cp .env.example .env.local

# Edit with your credentials
nano .env.local
```

3. **Start Development**
```bash
pnpm dev
```

### Environment Variables

Create a `.env.local` file:

```env
# WhatsApp Business API
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_webhook_verify_token

# API Configuration
WHATSAPP_API_BASE_URL=https://graph.facebook.com/v21.0
SENDZEN_API_BASE_URL=https://api.sendzen.io

# Database (if using database features)
DATABASE_URL=your_database_url_here

# Optional: Analytics and Monitoring
GOOGLE_ANALYTICS_ID=your_ga_id
SENTRY_DSN=your_sentry_dsn

# Optional: Authentication
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

## 🎨 Customization

### Theme Configuration

The starter kit includes a comprehensive theming system:

```typescript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        whatsapp: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#25D366',
          600: '#128C7E',
          900: '#075E54',
        }
      }
    }
  }
}
```

### Component Customization

Override default components:

```tsx
// components/custom-button.tsx
import { Button } from '@sendzen/ui-core/components/button'

export function CustomButton({ children, ...props }) {
  return (
    <Button 
      className="bg-whatsapp-500 hover:bg-whatsapp-600"
      {...props}
    >
      {children}
    </Button>
  )
}
```

## 📱 Applications Overview

### Suite Application (`apps/suite`)

The main application that combines all features:

- **Dashboard**: Overview of all WhatsApp activities
- **Message Center**: Send and receive messages
- **Template Manager**: Manage message templates
- **Analytics**: Usage statistics and insights
- **Settings**: Configuration and preferences

### API Playground (`apps/api-playground`)

Interactive API testing interface:

- **Request Builder**: Visual interface for API calls
- **Response Viewer**: Formatted API responses
- **History**: Track previous API calls
- **Collections**: Organize API requests

### Embedded Setup (`apps/embedded-setup`)

Standalone signup component:

- **Embeddable**: Can be integrated into any website
- **Customizable**: Match your brand colors and fonts
- **Responsive**: Works on all device sizes
- **Accessible**: Built with accessibility in mind

### Template Management (`apps/template-management`)

Dedicated template management system:

- **Template Editor**: Rich text editor for templates
- **Approval Workflow**: Submit templates for approval
- **Bulk Operations**: Manage multiple templates
- **Analytics**: Track template performance

## 🔧 Development

### Available Scripts

```bash
# Development
pnpm dev                    # Start all applications
pnpm dev:suite             # Start only suite app
pnpm dev:playground        # Start only playground app
pnpm dev:embedded          # Start only embedded app
pnpm dev:template          # Start only template app

# Building
pnpm build                 # Build all applications
pnpm build:suite           # Build suite app
pnpm build:playground      # Build playground app
pnpm build:embedded        # Build embedded app
pnpm build:template        # Build template app

# Testing
pnpm test                  # Run all tests
pnpm test:unit             # Run unit tests
pnpm test:integration      # Run integration tests
pnpm test:e2e              # Run E2E tests

# Linting and Formatting
pnpm lint                  # Lint all packages
pnpm lint:fix              # Fix linting issues
pnpm format                # Format code
pnpm check-types           # Type checking
```

### Adding New Features

1. **Create Feature Branch**
```bash
git checkout -b feature/new-feature
```

2. **Add Components to UI Packages**
```bash
# Add to core UI package
pnpm --filter ui-core add component-name

# Add to specific package
pnpm --filter ui-suite add component-name
```

3. **Update Applications**
```bash
# Use new components in applications
pnpm --filter suite add @sendzen/ui-core@workspace:*
```

## 📚 Documentation

### API Documentation

- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)
- [SendZen API Reference](https://docs.sendzen.io/api)
- [Component Documentation](./docs/components.md)

### Guides

- [Getting Started Guide](./docs/getting-started.md)
- [Customization Guide](./docs/customization.md)
- [Deployment Guide](./docs/deployment.md)
- [Contributing Guide](./docs/contributing.md)

### Examples

- [Basic Integration](./examples/basic-integration/)
- [Advanced Features](./examples/advanced-features/)
- [Custom Themes](./examples/custom-themes/)
- [Database Integration](./examples/database-integration/)

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy all applications
vercel --prod

# Deploy specific application
vercel --prod --cwd apps/suite
```

### Docker

```bash
# Build Docker images
docker-compose build

# Run with Docker Compose
docker-compose up -d
```

### Manual Deployment

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## 🔒 Security

- **Environment Variables**: Secure handling of sensitive data
- **API Keys**: Proper API key management and rotation
- **HTTPS**: Enforce HTTPS in production
- **CORS**: Configured CORS policies
- **Rate Limiting**: Built-in rate limiting
- **Input Validation**: Comprehensive input validation
- **Error Handling**: Secure error messages

## 🧪 Testing

### Test Structure

```
tests/
├── unit/                   # Unit tests
├── integration/            # Integration tests
├── e2e/                   # End-to-end tests
└── fixtures/              # Test fixtures
```

### Running Tests

```bash
# Run all tests
pnpm test

# Run specific test types
pnpm test:unit
pnpm test:integration
pnpm test:e2e

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch
```

## 📊 Monitoring & Analytics

### Built-in Monitoring

- **Error Tracking**: Automatic error reporting
- **Performance Monitoring**: Track application performance
- **Usage Analytics**: Monitor feature usage
- **Health Checks**: Application health monitoring

### Integration Options

- **Sentry**: Error tracking and performance monitoring
- **Google Analytics**: Usage analytics
- **Mixpanel**: Event tracking
- **LogRocket**: Session replay and debugging

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**: Add new features or fix bugs
4. **Run tests**: `pnpm test`
5. **Commit changes**: `git commit -m 'Add amazing feature'`
6. **Push to branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Use conventional commit messages
- Add tests for new features
- Update documentation as needed
- Ensure all linting passes
- Follow the existing code style

## 🐛 Troubleshooting

### Common Issues

**Build Failures**
- Check Node.js version (>= 20)
- Clear node_modules and reinstall
- Check TypeScript errors

**API Connection Issues**
- Verify API credentials
- Check network connectivity
- Validate API endpoints

**Component Not Rendering**
- Check import paths
- Verify component props
- Check browser console for errors

### Getting Help

- Check the [Issues](https://github.com/sendzen-io/whatsapp-api-starter-kit/issues) page
- Review the [Discussions](https://github.com/sendzen-io/whatsapp-api-starter-kit/discussions) section
- Join our community Discord server
- Read the [FAQ](./docs/faq.md)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)
- Powered by [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp)

## 📞 Support

- **Documentation**: [docs.sendzen.io](https://docs.sendzen.io)
- **Community**: [Discord](https://discord.gg/sendzen)
- **Email**: support@sendzen.io
- **Website**: [sendzen.io](https://sendzen.io)

---

**Made with ❤️ by the SendZen team**
