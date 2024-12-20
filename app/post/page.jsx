// app/posts/page.jsx
import { getServerSession } from 'next-auth/next';
import { redirect } from 'next/navigation';
import { authOptions } from '../api/auth/[...nextauth]/route';
import Navbar from '../../components/Navbar';
import LeftSidebar from '../../components/LeftSidebar';
import PostsPrompt from '../../components/Post/PostsPrompt';
import TrendingSidebar from '../../components/TrendingSidebar';
import { TopicProvider } from '../../contexts/TopicContext';
import BottomNavigation from '../../components/BottomNavigation';

export default async function Posts() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/auth/signin');
  }

  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <TopicProvider>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-center gap-4 pt-4 px-4">
          {/* Left Sidebar - Hidden on mobile, visible on xl breakpoint */}
          <div className="hidden xl:block w-56 flex-shrink-0">
            <LeftSidebar />
          </div>

          {/* Main Content */}
          <div className="w-full md:max-w-2xl flex-shrink-0">
            <PostsPrompt />
          </div>

          {/* Trending Sidebar - Hidden on mobile, visible on xl breakpoint */}
          <div className="hidden xl:block w-72 flex-shrink-0">
            <TrendingSidebar />
          </div>

          {/* Mobile Bottom Navigation */}
          <BottomNavigation />
        </div>
      </TopicProvider>
    </main>
  );
}