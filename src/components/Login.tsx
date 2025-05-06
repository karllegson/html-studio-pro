import React from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase";

const provider = new GoogleAuthProvider();

export const Login: React.FC = () => {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
      // User is signed in, Firebase will handle the session
    } catch (error) {
      alert("Login failed: " + (error as any).message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Sign in to continue</h1>
      <button
        onClick={handleLogin}
        className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700"
      >
        Sign in with Google
      </button>
    </div>
  );
}; 