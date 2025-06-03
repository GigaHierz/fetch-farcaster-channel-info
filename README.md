# Farcaster Channel Analysis Tool

This script is part of the developer suite used to evaluate builders who are part of [Proof of 
Ship](https://celoplatform.notion.site/
Build-With-Celo-Proof-of-Ship-17cd5cb803de8060ba10d22a72b549f8), a monthly program for builders 
to grow their onchain reputation and earn rewards in the Celo ecosystem.

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd fetch-farcaster-channel-info
   ```

2. **Set up your environment variables**
   - Create a `.env` file in the root directory
   - Copy the following template and add your Neynar API key:
   ```bash
   # Neynar API Key - Required for accessing Farcaster data
   NEYNAR_API_KEY=your_api_key_here
   
   # Optional Configuration
   CHANNEL_ID=celo
   ANALYSIS_DAYS=30
   ```

3. **Get your Neynar API Key**
   - Visit [Neynar's Quickstart Guide](https://docs.neynar.com/getting-started/quickstart)
   - Sign up for a free account
   - Navigate to your dashboard
   - Copy your API key
   - The free tier includes 100,000 requests per month, which is sufficient for most analysis needs

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Run the analysis**
   ```bash
   npm start
   ```

## 📊 Features

- Comprehensive channel analysis
- Author engagement metrics
- Content performance tracking
- Detailed markdown reports
- JSON data export

## 🔧 Configuration Options

In your `.env` file, you can customize:

- `NEYNAR_API_KEY`: Your Neynar API key (required)
- `CHANNEL_ID`: The Farcaster channel to analyze (default: "celo")
- `ANALYSIS_DAYS`: Number of days to analyze (default: 30)

## 📝 Report Output

The tool generates detailed markdown reports including:
- Summary statistics
- Top contributors
- Engagement analysis
- Activity timeline
- Channel insights

Reports are saved in the `output` directory with timestamps.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.