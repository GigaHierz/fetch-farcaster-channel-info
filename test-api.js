// test-api.js - Simple API test script
import 'dotenv/config';
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";
import { FeedType, FilterType } from "@neynar/nodejs-sdk/build/api/index.js";

console.log("🧪 Testing Neynar API Connection...\n");

// Check environment
if (!process.env.NEYNAR_API_KEY) {
  console.error("❌ NEYNAR_API_KEY not found in .env file");
  process.exit(1);
}

const apiKey = process.env.NEYNAR_API_KEY;
console.log(`🔑 API Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)} (${apiKey.length} chars)`);

// Initialize client
const config = new Configuration({
  apiKey: process.env.NEYNAR_API_KEY,
});

const client = new NeynarAPIClient(config);

async function testAPI() {
  try {
    console.log("📡 Testing basic feed fetch...");
    
    // Try a simple recent feed fetch (no date filtering)
    const feed = await client.fetchFeed({
      feedType: FeedType.Filter,
      filterType: FilterType.ChannelId,
      channelId: "celo",
      limit: 5, // Just get 5 recent casts
    });
    
    console.log("✅ API connection successful!");
    console.log(`📊 Fetched ${feed.casts?.length || 0} recent casts`);
    
    if (feed.casts && feed.casts.length > 0) {
      const latestCast = feed.casts[0];
      console.log(`📅 Latest cast: ${new Date(latestCast.timestamp).toLocaleString()}`);
      console.log(`👤 Author: ${latestCast.author.displayName || latestCast.author.username}`);
      console.log(`💬 Text: "${latestCast.text.substring(0, 100)}${latestCast.text.length > 100 ? '...' : ''}"`);
    }
    
    return true;
  } catch (error) {
    console.error("❌ API Test Failed:");
    console.error(`   Status: ${error.response?.status || 'Unknown'}`);
    console.error(`   Message: ${error.message}`);
    
    if (error.response?.status === 402) {
      console.error("\n💡 HTTP 402 = Payment Required");
      console.error("   This usually means:");
      console.error("   1. Your API key needs a paid plan");
      console.error("   2. You've exceeded free tier limits");
      console.error("   3. Historical data requires a paid plan");
      console.error("\n   💳 Check your plan at: https://neynar.com");
    } else if (error.response?.status === 401) {
      console.error("\n💡 HTTP 401 = Unauthorized");
      console.error("   This usually means:");
      console.error("   1. Invalid API key");
      console.error("   2. API key not properly set in .env file");
    }
    
    return false;
  }
}

// Run the test
testAPI().then(success => {
  if (success) {
    console.log("\n✅ Your API setup is working!");
    console.log("   You can now run the main analysis script.");
  } else {
    console.log("\n❌ API setup needs attention before running the main script.");
  }
});