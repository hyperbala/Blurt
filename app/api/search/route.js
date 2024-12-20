// app/api/search/route.js
import { connectToDB } from '../../../lib/mongodb';
import Post from '../../../models/Post';
import Question from '../../../models/Question';
import { NextResponse } from 'next/server';

// Helper function to ensure indexes exist
async function ensureIndexes() {
  try {
    const postIndexes = await Post.collection.getIndexes();
    const questionIndexes = await Question.collection.getIndexes();
    
    if (!postIndexes.text) {
      await Post.collection.createIndex(
        { title: "text", content: "text" },
        { name: "text", default_language: "english" }
      );
    }
    
    if (!questionIndexes.text) {
      await Question.collection.createIndex(
        { title: "text", content: "text", category: "text" },
        { name: "text", default_language: "english" }
      );
    }
  } catch (error) {
    console.error('Error ensuring indexes:', error);
    // Continue execution - we'll fall back to regex search if text search fails
  }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json([], { status: 200 });
    }

    await connectToDB();
    await ensureIndexes();

    // Try text search first, fall back to regex if it fails
    const searchResults = await performSearch(query);
    
    // Format and sort results
    const formattedResults = formatSearchResults(searchResults, query);

    return NextResponse.json(formattedResults, { status: 200 });
  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}

async function performSearch(query) {
  try {
    // Try text search first
    const textSearchResults = await performTextSearch(query);
    if (textSearchResults.length > 0) {
      return textSearchResults;
    }
  } catch (error) {
    console.log('Text search failed, falling back to regex search');
  }

  // Fall back to regex search
  return performRegexSearch(query);
}

async function performTextSearch(query) {
  const searchQuery = {
    $text: {
      $search: query,
      $caseSensitive: false,
      $diacriticSensitive: false
    }
  };

  const [posts, questions] = await Promise.all([
    Post.find(searchQuery)
      .select('title content image createdAt type author')
      .populate('author', 'name username image email')
      .sort({ score: { $meta: 'textScore' } })
      .limit(10),
    
    Question.find(searchQuery)
      .select('title content image createdAt type category author')
      .populate('author', 'name username image email')
      .sort({ score: { $meta: 'textScore' } })
      .limit(10)
  ]);

  return [...posts, ...questions];
}

async function performRegexSearch(query) {
  // Escape special regex characters
  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  const regexQuery = {
    $or: [
      { title: { $regex: escapedQuery, $options: 'i' } },
      { content: { $regex: escapedQuery, $options: 'i' } }
    ]
  };

  const [posts, questions] = await Promise.all([
    Post.find(regexQuery)
      .select('title content image createdAt type author')
      .populate('author', 'name username image _id')
      .limit(10),
    
    Question.find({
      $or: [
        ...regexQuery.$or,
        { category: { $regex: escapedQuery, $options: 'i' } }
      ]
    })
      .select('title content image createdAt type category author')
      .populate('author', 'name username image email _id')
      .limit(10)
  ]);

  return [...posts, ...questions];
}

function formatSearchResults(results, query) {
  const formattedResults = results.map(doc => ({
    id: doc._id.toString(),
    title: doc.title,
    description: doc.content.substring(0, 150) + (doc.content.length > 150 ? '...' : ''),
    image: doc.image || null,
    url: `/${doc.type}/${doc._id}`,
    type: doc.type,
    category: doc.category || null,
    author: {
      name: doc.author?.name || 'Anonymous',
      username: doc.author?.username || null,
      email: doc.author?.email || null,
      image: doc.author?.image || null,
      _id: doc.author?._id.toString()
    },
    createdAt: doc.createdAt
  }));

  // Sort by relevance and recency
  return formattedResults.sort((a, b) => {
    const scoreA = calculateRelevanceScore(a, query);
    const scoreB = calculateRelevanceScore(b, query);
    return scoreB - scoreA;
  });
}

function calculateRelevanceScore(doc, query) {
  const queryLower = query.toLowerCase();
  const titleLower = doc.title.toLowerCase();
  const descriptionLower = doc.description.toLowerCase();
  
  let score = 0;
  
  // Exact matches (highest weight)
  if (titleLower === queryLower) score += 100;
  if (doc.category?.toLowerCase() === queryLower) score += 80;
  
  // Partial matches (weighted by position)
  if (titleLower.startsWith(queryLower)) score += 70;
  if (titleLower.includes(queryLower)) score += 50;
  if (descriptionLower.includes(queryLower)) score += 25;
  if (doc.category?.toLowerCase().includes(queryLower)) score += 30;
  
  // Boost recent content (last 6 months get higher scores)
  const ageInDays = (new Date() - new Date(doc.createdAt)) / (1000 * 60 * 60 * 24);
  const recencyBoost = Math.max(0, 20 - (ageInDays / 30)); // Boost for content less than 20 months old
  
  return score + recencyBoost;
}