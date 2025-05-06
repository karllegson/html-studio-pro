import React, { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "./firebase";
import { Login } from "./components/Login";
import HtmlBuilder from "./pages/HtmlBuilder";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { TaskProvider } from "./context/TaskContext";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Footer from '@/components/Footer';
import AdminPage from './pages/Admin';

const queryClient = new QueryClient();

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!user) return <Login />;

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="min-h-screen flex flex-col">
          <main className="flex-grow">
            <TaskProvider>
              <TooltipProvider>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/builder/:taskId" element={<HtmlBuilder />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </TooltipProvider>
            </TaskProvider>
          </main>
          <Footer />
          <Toaster />
        </div>
      </Router>
    </QueryClientProvider>
  );
};

export default App;
