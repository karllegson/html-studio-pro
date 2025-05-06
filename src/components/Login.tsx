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
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <div className="bg-card shadow-lg rounded-xl px-8 py-10 w-full max-w-md flex flex-col items-center border border-border">
        {/* Logo or App Name */}
        <div className="mb-6 flex flex-col items-center">
          {/* Replace with your logo if you have one */}
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center mb-2 shadow">
            <span className="text-2xl font-bold text-white">H</span>
          </div>
          <h1 className="text-xl font-bold text-foreground">HTML Studio Pro</h1>
          <p className="text-muted-foreground mt-1 text-center">Sign in to continue</p>
        </div>
        {/* Google Login Button */}
        <button
          onClick={handleLogin}
          className="flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-3 shadow transition-all font-medium focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className="w-6 h-6 bg-white rounded-full"
          />
          Sign in with Google
        </button>
        {/* Footer */}
        <div className="mt-8 text-xs text-muted-foreground text-center">
          &copy; {new Date().getFullYear()} HTML Studio Pro. All rights reserved.
        </div>
      </div>
    </div>
  );
}; 