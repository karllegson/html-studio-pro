import React from "react";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../firebase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const provider = new GoogleAuthProvider();

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
      onClose();
    } catch (error) {
      alert("Login failed: " + (error as any).message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">Sign in to HTML Studio Pro</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center gap-6 py-4">
          <img src="/favicon.svg" alt="Logo" className="w-16 h-16" />
          <p className="text-muted-foreground text-center">
            Sign in with your Google account to access the dashboard and manage your HTML projects.
          </p>
          <Button
            onClick={handleLogin}
            className="w-full flex items-center justify-center gap-3"
            size="lg"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5 bg-white rounded-full"
            />
            Sign in with Google
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

