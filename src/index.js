// src/index.js
import 'dotenv/config';
import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";
import { FeedType, FilterType } from "@neynar/nodejs-sdk/build/api/index.js";
import { exportToMarkdown, exportToJson } from "./utils/markdown-exporter.js";

// Initialize Neynar client
const config = new Configuration({
  apiKey: process.env.NEYNAR_API_KEY,
});

const client = new NeynarAPIClient(config);

/**
 * Fetches all casts from a channel for the specified date range
 */
async function fetchChannelCasts(channelId = "celo", startDate, endDate) {
  const allCasts = [];
  let cursor = null;
  let hasMore = true;
  let requestCount = 0;
  
  console.log(`📡 Fetching casts from "${channelId}" channel from ${startDate.toDateString()} to ${endDate.toDateString()}`);
  
  while (hasMore && requestCount < 150) { // Increased safety limit for larger date ranges
    try {
      const feedParams = {
        feedType: FeedType.Filter,
        filterType: FilterType.ChannelId,
        channelId,
        limit: 100,
      };
      
      if (cursor) {
        feedParams.cursor = cursor;
      }
      
      const feed = await client.fetchFeed(feedParams);
      requestCount++;
      
      if (feed.casts && feed.casts.length > 0) {
        // Filter casts by date range
        const castsInRange = feed.casts.filter(cast => {
          const castDate = new Date(cast.timestamp);
          return castDate >= startDate && castDate <= endDate;
        });
        
        allCasts.push(...castsInRange);
        
        // Check if we've gone past our start date
        const oldestCastInBatch = new Date(Math.min(...feed.casts.map(cast => new Date(cast.timestamp))));
        if (oldestCastInBatch < startDate) {
          console.log("✅ Reached casts older than start date, stopping...");
          hasMore = false;
        } else if (feed.next && feed.next.cursor) {
          cursor = feed.next.cursor;
          console.log(`   Fetched ${allCasts.length} casts in date range (${requestCount} requests)...`);
          
          // Rate limiting - be nice to the API
          await new Promise(resolve => setTimeout(resolve, 200));
        } else {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    } catch (error) {
      console.error("❌ Error fetching feed:", error.message);
      hasMore = false;
    }
  }
  
  console.log(`\n✅ Total casts fetched in date range: ${allCasts.length}`);
  return allCasts;
}

/**
 * Analyzes casts and returns author statistics
 */
function analyzeCastsByAuthor(casts) {
  const authorStats = new Map();
  
  casts.forEach(cast => {
    const author = cast.author;
    const authorKey = author.fid;
    
    if (!authorStats.has(authorKey)) {
      authorStats.set(authorKey, {
        fid: author.fid,
        username: author.username,
        displayName: author.displayName,
        pfpUrl: author.pfp?.url || null,
        followerCount: author.follower_count || 0,
        followingCount: author.following_count || 0,
        verifications: author.verifications || [],
        castCount: 0,
        totalLikes: 0,
        totalReplies: 0,
        totalRecasts: 0,
        casts: []
      });
    }
    
    const stats = authorStats.get(authorKey);
    stats.castCount++;
    
    // Aggregate engagement metrics
    const likes = cast.reactions?.likes_count || 0;
    const replies = cast.replies?.count || 0;
    const recasts = cast.reactions?.recasts_count || 0;
    
    stats.totalLikes += likes;
    stats.totalReplies += replies;
    stats.totalRecasts += recasts;
    
    stats.casts.push({
      hash: cast.hash,
      text: cast.text.substring(0, 100) + (cast.text.length > 100 ? '...' : ''),
      timestamp: cast.timestamp,
      likes,
      replies,
      recasts
    });
  });
  
  // Convert to array and sort by cast count
  return Array.from(authorStats.values()).sort((a, b) => b.castCount - a.castCount);
}

/**
 * Main execution function
 */
async function main() {
  try {
    // Configuration - May 2025 date range
    const channelId = "celo";
    const startDate = new Date('2025-05-01T00:00:00Z'); // May 1st, 2025
    const endDate = new Date('2025-05-31T23:59:59Z');   // May 31st, 2025
    const topN = 25;
    
    console.log("🚀 Starting Celo Channel Analysis for May 2025...\n");
    
    // Validate API key
    if (!process.env.NEYNAR_API_KEY) {
      throw new Error("NEYNAR_API_KEY not found in environment variables. Please check your .env file.");
    }
    
    // Validate date range
    const today = new Date();
    if (startDate > today) {
      console.log("⚠️  Warning: Start date is in the future. Results may be limited.");
    }
    
    // Fetch casts for the specific date range
    const allCasts = await fetchChannelCasts(channelId, startDate, endDate);
    
    if (allCasts.length === 0) {
      console.log("❌ No casts found in the specified time period (May 1-31, 2025).");
      return;
    }
    
    // Analyze data
    console.log("📊 Analyzing cast data...");
    const authorStats = analyzeCastsByAuthor(allCasts);
    
    // Generate timestamp for filenames
    const filename = `celo-analysis-may-2025`;
    
    // Calculate days for reporting
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
    
    // Export to markdown
    await exportToMarkdown(authorStats, allCasts, {
      channelId,
      startDate,
      endDate,
      daysDiff,
      topN,
      filename: `output/${filename}.md`
    });
    
    // Optionally export raw data to JSON
    await exportToJson({
      authorStats,
      allCasts,
      metadata: {
        channelId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        daysDiff,
        exportDate: new Date().toISOString(),
        totalAuthors: authorStats.length,
        totalCasts: allCasts.length
      }
    }, `output/${filename}.json`);
    
    // Console summary
    console.log("\n" + "=".repeat(60));
    console.log("📈 ANALYSIS COMPLETE");
    console.log("=".repeat(60));
    console.log(`Channel: ${channelId}`);
    console.log(`Time Period: May 1-31, 2025 (${daysDiff} days)`);
    console.log(`Total Casts: ${allCasts.length.toLocaleString()}`);
    console.log(`Unique Authors: ${authorStats.length.toLocaleString()}`);
    if (authorStats.length > 0) {
      console.log(`Most Active: ${authorStats[0].displayName || authorStats[0].username} (${authorStats[0].castCount} casts)`);
    }
    console.log(`Files Generated:`);
    console.log(`  📄 output/${filename}.md`);
    console.log(`  📊 output/${filename}.json`);
    console.log("=".repeat(60));
    
  } catch (error) {
    console.error("❌ Error in main execution:", error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the analysis
main();