// app/auth/signin/page.js
'use client';

import { signIn } from 'next-auth/react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import upavana from '../../../public/logo/upavana.svg';
export default function SignIn() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const result = await signIn('google', {
        callbackUrl: '/auth/username-select',
        redirect: false,
      });
      
      if (result?.error) {
        console.error(result.error);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
        <Image src={upavana} alt="Upavana" width={1} height={1} className="mx-auto h-28 w-auto" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-[#065535] hover:bg-[#043B24] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#043B24]"
        >
          {loading ? (
            'Loading...'
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              </svg>
              Continue with Google
            </>
          )}
        </button>
      </div>
    </div>
  );
}