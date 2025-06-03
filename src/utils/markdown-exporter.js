// src/utils/markdown-exporter.js
import fs from 'fs/promises';
import path from 'path';

/**
 * Exports analysis results to a formatted markdown file
 */
export async function exportToMarkdown(authorStats, allCasts, options = {}) {
  const {
    channelId = "celo",
    startDate,
    endDate,
    daysDiff,
    topN = 25,
    filename = `celo-analysis-${new Date().toISOString().split('T')[0]}.md`
  } = options;
  
  const totalCasts = allCasts.length;
  const totalAuthors = authorStats.length;
  const topAuthors = authorStats.slice(0, topN);
  
  // Calculate additional metrics
  const totalEngagement = authorStats.reduce((sum, author) => 
    sum + author.totalLikes + author.totalReplies + author.totalRecasts, 0);
  
  const avgCastsPerAuthor = (totalCasts / totalAuthors).toFixed(2);
  const avgEngagementPerCast = totalCasts > 0 ? (totalEngagement / totalCasts).toFixed(2) : 0;
  const avgCastsPerDay = (totalCasts / daysDiff).toFixed(1);
  
  let markdown = `# Celo Channel Analysis Report - May 2025

**Generated:** ${new Date().toLocaleString()}  
**Channel:** \`${channelId}\`  
**Analysis Period:** ${startDate.toDateString()} - ${endDate.toDateString()} (${daysDiff} days)

---

## 📊 Summary Statistics

| Metric | Value |
|--------|-------|
| **Total Casts** | ${totalCasts.toLocaleString()} |
| **Unique Authors** | ${totalAuthors.toLocaleString()} |
| **Avg Casts/Author** | ${avgCastsPerAuthor} |
| **Avg Casts/Day** | ${avgCastsPerDay} |
| **Total Engagement** | ${totalEngagement.toLocaleString()} interactions |
| **Avg Engagement/Cast** | ${avgEngagementPerCast} interactions |

---

## 🏆 Top ${topN} Most Active Contributors

`;

  topAuthors.forEach((author, index) => {
    const rank = index + 1;
    const avgLikesPerCast = author.castCount > 0 ? (author.totalLikes / author.castCount).toFixed(1) : '0';
    const avgRepliesPerCast = author.castCount > 0 ? (author.totalReplies / author.castCount).toFixed(1) : '0';
    const totalEngagementAuthor = author.totalLikes + author.totalReplies + author.totalRecasts;
    
    markdown += `### ${rank}. ${author.displayName || author.username}

**Username:** @${author.username}  
**FID:** ${author.fid}  
**Followers:** ${author.followerCount.toLocaleString()}  
**Following:** ${author.followingCount.toLocaleString()}

#### Activity Metrics
- **Casts Posted:** ${author.castCount} (${((author.castCount / totalCasts) * 100).toFixed(1)}% of total)
- **Total Likes:** ${author.totalLikes.toLocaleString()} (avg: ${avgLikesPerCast} per cast)
- **Total Replies:** ${author.totalReplies.toLocaleString()} (avg: ${avgRepliesPerCast} per cast)
- **Total Recasts:** ${author.totalRecasts.toLocaleString()}
- **Total Engagement:** ${totalEngagementAuthor.toLocaleString()} interactions

${author.verifications && author.verifications.length > 0 ? `**Verified Addresses:** ${author.verifications.length}` : ''}

`;

    // Add some recent casts as examples
    if (author.casts.length > 0) {
      markdown += `#### Recent Casts Preview\n\n`;
      const recentCasts = author.casts
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 3);
      
      recentCasts.forEach((cast, i) => {
        const date = new Date(cast.timestamp).toLocaleDateString();
        markdown += `${i + 1}. *${date}* - "${cast.text}" (${cast.likes}❤️ ${cast.replies}💬 ${cast.recasts}🔄)\n`;
      });
      markdown += '\n';
    }
    
    markdown += '---\n\n';
  });

  // Add engagement analysis
  markdown += `## 📈 Engagement Analysis

### Top Performers by Engagement Rate

`;

  // Sort by engagement rate (total engagement / cast count)
  const engagementLeaders = authorStats
    .filter(author => author.castCount >= 3) // Only include authors with at least 3 casts
    .map(author => ({
      ...author,
      engagementRate: (author.totalLikes + author.totalReplies + author.totalRecasts) / author.castCount
    }))
    .sort((a, b) => b.engagementRate - a.engagementRate)
    .slice(0, 10);

  engagementLeaders.forEach((author, index) => {
    markdown += `${index + 1}. **${author.displayName || author.username}** (@${author.username})  
   - ${author.engagementRate.toFixed(1)} avg interactions/cast (${author.castCount} casts)  
   - ${author.totalLikes}❤️ ${author.totalReplies}💬 ${author.totalRecasts}🔄\n\n`;
  });

  // Activity timeline
  markdown += `## 📅 Activity Timeline

### Daily Cast Distribution

`;

  // Group casts by day
  const dailyActivity = {};
  allCasts.forEach(cast => {
    const date = new Date(cast.timestamp).toDateString();
    dailyActivity[date] = (dailyActivity[date] || 0) + 1;
  });

  const sortedDays = Object.entries(dailyActivity)
    .sort(([a], [b]) => new Date(b) - new Date(a))
    .slice(0, 14); // Last 14 days

  markdown += `| Date | Casts | % of Total |\n|------|-------|------------|\n`;
  
  sortedDays.forEach(([date, count]) => {
    const percentage = ((count / totalCasts) * 100).toFixed(1);
    markdown += `| ${date} | ${count} | ${percentage}% |\n`;
  });

  // Channel insights
  markdown += `

---

## 🔍 Channel Insights

### Community Characteristics
- **Community Size:** ${totalAuthors.toLocaleString()} active contributors
- **Activity Level:** ${avgCastsPerDay} casts per day on average
- **Engagement Health:** ${avgEngagementPerCast} interactions per cast indicates ${ 
    avgEngagementPerCast > 5 ? 'high' : avgEngagementPerCast > 2 ? 'moderate' : 'low'
  } community engagement

### Distribution Analysis
- **Top 10% of authors** (${Math.ceil(totalAuthors * 0.1)} people) contributed **${
    ((topAuthors.slice(0, Math.ceil(totalAuthors * 0.1)).reduce((sum, a) => sum + a.castCount, 0) / totalCasts) * 100).toFixed(1)
  }%** of all casts
- **Most active contributor** posted ${authorStats[0].castCount} casts (${((authorStats[0].castCount / totalCasts) * 100).toFixed(1)}% of total activity)

---

## 📋 Methodology

**Data Source:** Farcaster via Neynar API  
**Channel:** ${channelId}  
**Collection Period:** ${daysDiff} days (${startDate.toDateString()} to ${endDate.toDateString()})  
**Total API Requests:** Paginated through all available data  
**Metrics Calculated:**
- Cast counts per author
- Engagement metrics (likes, replies, recasts)
- Follower/following ratios
- Activity distribution over time

**Note:** All timestamps are in UTC. Engagement metrics reflect the state at the time of data collection.

---

*Report generated by Celo Channel Analyzer - ${new Date().toLocaleString()}*
`;

  // Ensure output directory exists
  const dir = path.dirname(filename);
  await fs.mkdir(dir, { recursive: true });
  
  // Write the markdown file
  await fs.writeFile(filename, markdown, 'utf8');
  
  console.log(`✅ Markdown report exported to: ${filename}`);
  return filename;
}

/**
 * Exports raw data to JSON file
 */
export async function exportToJson(data, filename) {
  try {
    // Ensure output directory exists
    const dir = path.dirname(filename);
    await fs.mkdir(dir, { recursive: true });
    
    // Write JSON file with pretty formatting
    await fs.writeFile(filename, JSON.stringify(data, null, 2), 'utf8');
    
    console.log(`✅ JSON data exported to: ${filename}`);
    return filename;
  } catch (error) {
    console.error(`❌ Error exporting JSON: ${error.message}`);
    throw error;
  }
}