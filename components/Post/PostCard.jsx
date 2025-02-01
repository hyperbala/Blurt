// components/Post/PostCard.jsx
import { User } from '@nextui-org/react';
import { Heart, Bookmark, MessageCircle, Globe2 ,Trash2 } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';

import Image from 'next/image';

const PostCard = ({
  item,
  session,
  likedItems,
  savedItems,
  followingUsers,
  handleLike,
  handleSave,
  handleFollow,
  handleDelete,
  onClick,
  isQuestion = false
}) => {

  const isOwnContent = session?.user?.id === item.author?._id;

  return (
    <div
      className="bg-white border rounded-xl shadow-sm mb-4 hover:shadow-md transition-all duration-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <User
              name={item.author?.name || "Anonymous"}
              description={item.author?.username ? `@${item.author.username.toLowerCase().replace(' ', '')}` : '@anonymous'}
              avatarProps={{
                src: item?.author?.image
              }}
            />
            <div className="flex items-center space-x-1 bg-green-50 rounded-full px-2 py-1">
              <Globe2 className="w-3 h-3 text-green-600" />
              <span className="text-xs text-green-700">
                {isQuestion ? 'Question' : 'Public'}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-3">

          {isOwnContent && (
              <button
                className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors duration-200"
                onClick={(e) => handleDelete(item._id, e)}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}

            <button
              className={`px-4 py-1.5 text-sm font-medium ${session?.user?.id === item.author?._id
                ? 'text-green-600 border-green-600 cursor-not-allowed'
                : followingUsers.has(item.author?._id)
                  ? 'text-white bg-green-600 border-green-600'
                  : 'text-green-600 border-green-600 hover:bg-green-50'
                } border rounded-full transition-colors duration-200`}
              onClick={(e) => handleFollow(item.author?._id, e)}
              disabled={!session?.user || session.user.id === item.author?._id}
            >
              {session?.user?.id === item.author?._id ? 'You' :
                followingUsers.has(item.author?._id) ? 'Following' : 'Follow'}
            </button>
          </div>

        </div>

        <h2 className="text-xl font-semibold mb-2 text-gray-800">{item.title || 'Untitled Item'}</h2>

        {item.image && (
          <div className="relative aspect-video mb-4 bg-gray-50 rounded-lg overflow-hidden">
            <Image
              src={item.image}
              alt={item.title || 'Saved item'}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority={false}
            />
          </div>
        )}

        <p className="text-gray-600 mb-4 line-clamp-3">{item.content}</p>

        <div className="flex items-center justify-between text-sm text-gray-500 p-4">
          <span>{formatDistanceToNowStrict(new Date(item.createdAt), { addSuffix: true })}</span>
          <div className="flex items-center space-x-4">
            <button
              className={`flex items-center gap-2 ${likedItems.has(item._id) ? 'text-green-600' : 'hover:text-green-600'}`}
              onClick={(e) => handleLike(item._id, e)}
            >
              <Heart className={`w-4 h-4 ${likedItems.has(item._id) ? 'fill-current' : ''}`} />
              <span>{item.likes || 0}</span>
            </button>
            <button
              className={`flex items-center ${savedItems.has(item._id) ? 'text-green-600' : 'hover:text-green-600'}`}
              onClick={(e) => handleSave(item._id, e)}
            >
              <Bookmark className={`w-4 h-4 ${savedItems.has(item._id) ? 'fill-current' : ''}`} />
            </button>
            <button className="flex items-center gap-2 hover:text-green-600">
              <MessageCircle className="w-4 h-4" />
              <span>{item.comments?.length || 0}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;