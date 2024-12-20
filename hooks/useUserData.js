// hooks/useUserData.js
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export const useUserData = () => {
  const { data: session } = useSession();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user?.id) return;
      
      try {
        const res = await fetch(`/api/users/${session.user.id}/follow-data`);
        if (res.ok) {
          const data = await res.json();
          setUserData(data);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, [session]);

  return userData;
};