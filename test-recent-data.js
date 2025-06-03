// test-recent-data.js - Test with recent data first
import 'dotenv/config';
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";
import { FeedType, FilterType } from "@neynar/nodejs-sdk/build/api/index.js";

const config = new Configuration({
  apiKey: process.env.NEYNAR_API_KEY,
});

const client = new NeynarAPIClient(config);

async function testRecentData() {
  try {
    console.log("🧪 Testing recent data access...");
    
    // First try: Just get recent data (last 7 days)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    
    const feed = await client.fetchFeed({
      feedType: FeedType.Filter,
      filterType: FilterType.ChannelId,
      channelId: "celo",
      limit: 10,
    });
    
    console.log("✅ Recent data fetch successful!");
    console.log(`📊 Got ${feed.casts?.length || 0} casts`);
    
    if (feed.casts && feed.casts.length > 0) {
      const recentCasts = feed.casts.filter(cast => {
        return new Date(cast.timestamp) >= cutoffDate;
      });
      
      console.log(`📅 Casts from last 7 days: ${recentCasts.length}`);
      
      if (recentCasts.length > 0) {
        console.log(`📅 Date range: ${new Date(recentCasts[recentCasts.length - 1].timestamp).toDateString()} to ${new Date(recentCasts[0].timestamp).toDateString()}`);
      }
    }
    
    // Now try to go back further
    console.log("\n🕰️ Testing historical data access...");
    
    let cursor = feed.next?.cursor;
    let totalFetched = feed.casts?.length || 0;
    let oldestDate = new Date();
    
    for (let i = 0; i < 3 && cursor; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      
      try {
        const olderFeed = await client.fetchFeed({
          feedType: FeedType.Filter,
          filterType: FilterType.ChannelId,
          channelId: "celo",
          limit: 10,
          cursor: cursor
        });
        
        if (olderFeed.casts && olderFeed.casts.length > 0) {
          totalFetched += olderFeed.casts.length;
          const batchOldest = new Date(olderFeed.casts[olderFeed.casts.length - 1].timestamp);
          if (batchOldest < oldestDate) {
            oldestDate = batchOldest;
          }
          console.log(`   Batch ${i + 1}: ${olderFeed.casts.length} casts, oldest: ${batchOldest.toDateString()}`);
          cursor = olderFeed.next?.cursor;
        } else {
          break;
        }
      } catch (error) {
        console.log(`   ❌ Error on batch ${i + 1}: ${error.message}`);
        break;
      }
    }
    
    console.log(`\n📈 Total accessible: ${totalFetched} casts`);
    console.log(`📅 Oldest accessible: ${oldestDate.toDateString()}`);
    
    // Check if May 2025 is accessible
    const may2025Start = new Date('2025-05-01');
    if (oldestDate <= may2025Start) {
      console.log("✅ May 2025 data should be accessible!");
      return true;
    } else {
      console.log("⚠️ May 2025 data might not be accessible yet.");
      console.log(`   Oldest data: ${oldestDate.toDateString()}`);
      console.log(`   Target: ${may2025Start.toDateString()}`);
      return false;
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    
    if (error.response?.status === 402) {
      console.log("\n💡 Still getting 402 - subscription might still be activating");
      console.log("   Try again in 5-10 minutes");
    }
    
    return false;
  }
}

testRecentData().then(success => {
  if (success) {
    console.log("\n🎉 Your API can access historical data!");
    console.log("   You should be able to run the May 2025 analysis.");
  } else {
    console.log("\n⏳ Either wait for subscription activation or use recent data analysis.");
  }
});