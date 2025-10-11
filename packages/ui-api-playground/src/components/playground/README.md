# SendZen API Playground

A comprehensive code generation playground for the SendZen WhatsApp API, built with Next.js, Tailwind CSS, and shadcn/ui components.

## Features

### 🚀 API Request Configuration
- **Multiple API Endpoints**: Support for text, image, document, and button messages
- **Request JSON Preview**: Real-time preview of the API request payload
- **Endpoint Selection**: Easy switching between different message types

### 💻 Code Generation
- **8 Programming Languages**: JavaScript (Node.js), Python, PHP, Java, C# (.NET), Ruby, Go, and cURL
- **Real-time Code Updates**: Generated code updates automatically when configuration changes
- **Copy to Clipboard**: One-click code copying with toast notifications
- **Syntax Highlighting**: Clean, readable code formatting

### ⚙️ Configuration Panel
- **Access Token Management**: Secure token input with password masking
- **Recipient Details**: Phone number configuration for message recipients
- **WABA Selection**: Choose from available WhatsApp Business Accounts
- **WABA Details**: View business information, verification status, and template counts
- **Message Content**: Customizable message text for different message types

### 🎨 UI/UX Features
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark/Light Theme Support**: Integrates with the project's theme system
- **Modern Interface**: Built with shadcn/ui components for consistency
- **Interactive Elements**: Accordions, tabs, and form controls for better UX

## Components

### `PlaygroundContainer`
The main component that orchestrates the entire playground experience:
- Manages state for API configuration
- Handles code generation logic
- Provides the main UI layout

### Key Features:
- **State Management**: Uses React hooks for configuration state
- **Code Generation**: Supports 8 different programming languages
- **Real-time Updates**: Configuration changes immediately update generated code
- **Toast Notifications**: User feedback for copy operations

## Usage

Navigate to `/playground` in your Next.js application to access the playground.

### Configuration Steps:
1. **Set Access Token**: Enter your SendZen API access token
2. **Configure Recipient**: Set the recipient phone number
3. **Select WABA**: Choose your WhatsApp Business Account
4. **Choose API Endpoint**: Select the message type (text, image, document, buttons)
5. **Customize Message**: Enter your message content
6. **Generate Code**: Select your preferred programming language
7. **Copy & Use**: Copy the generated code to your clipboard

## API Endpoints Supported

- **Text Messages**: Simple text-based WhatsApp messages
- **Image Messages**: Send images with optional captions
- **Document Messages**: Send documents (PDF, etc.) with captions
- **Button Messages**: Interactive messages with reply buttons

## Technical Implementation

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS with custom design system
- **Components**: shadcn/ui component library
- **State Management**: React hooks (useState)
- **Notifications**: Custom toast system
- **Icons**: Lucide React icon library

## Integration

The playground integrates seamlessly with the existing SendZen project structure:
- Uses the project's design system and theming
- Follows established patterns for API configuration
- Leverages existing authentication and branding systems
- Maintains consistency with other dashboard components
