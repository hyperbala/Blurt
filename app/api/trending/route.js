// app/api/trending/route.js
import { connectToDB } from '../../../lib/mongodb';
import Post from '../../../models/Post';
import { NextResponse } from 'next/server';

// Helper function to extract keywords from text
function extractKeywords(text) {
  if (!text) return [];
  
  // Convert to lowercase and remove special characters
  const cleanText = text.toLowerCase().replace(/[^\w\s]/g, '');
  
  // Split into words and filter out common words and short terms
  const commonWords = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 
    'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 
    'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they', 
    'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one', 
    'all', 'would', 'there', 'their', 'what'
  ]);
  
  return cleanText.split(/\s+/).filter(word => 
    word.length > 2 && !commonWords.has(word)
  );
}

export async function GET() {
  try {
    await connectToDB();

    // Get posts from the last 24 hours for more dynamic trending topics
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    const posts = await Post.find({
      createdAt: { $gte: oneDayAgo },
      type: { $ne: 'question' } // Exclude questions
    })
    .select('title content likes comments createdAt')
    .lean();

    const keywordStats = new Map();

    posts.forEach(post => {
      const titleKeywords = extractKeywords(post.title || '');
      const contentKeywords = extractKeywords(post.content || '');
      const uniqueKeywords = [...new Set([...titleKeywords, ...contentKeywords])];

      // Calculate post engagement
      const likesCount = Array.isArray(post.likes) ? post.likes.length : 0;
      const commentsCount = Array.isArray(post.comments) ? post.comments.length : 0;
      
      // Time decay factor - newer posts get higher weight
      const hoursAgo = (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60);
      const timeDecayFactor = 1 / (1 + (hoursAgo / 24)); // Decay over 24 hours

      // Calculate engagement score with time decay
      const engagementScore = (likesCount + (commentsCount * 2)) * timeDecayFactor;

      uniqueKeywords.forEach(keyword => {
        if (!keywordStats.has(keyword)) {
          keywordStats.set(keyword, {
            count: 0,
            engagement: 0
          });
        }
        const stats = keywordStats.get(keyword);
        stats.count += 1;
        stats.engagement += engagementScore;
      });
    });

    // Convert to array and calculate final trending score
    const trendingKeywords = Array.from(keywordStats.entries())
      .map(([keyword, stats]) => ({
        title: keyword,
        postsCount: stats.count,
        trendingScore: stats.engagement * Math.log(1 + stats.count) // Combine engagement and frequency
      }))
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, 5) // Get top 5 trending topics
      .map(({ title, postsCount }) => ({
        title,
        postsCount,
        type: 'topic'
      }));

    return NextResponse.json(trendingKeywords);
  } catch (error) {
    console.error('Error in GET /api/trending:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending topics' }, 
      { status: 500 }
    );
  }
}