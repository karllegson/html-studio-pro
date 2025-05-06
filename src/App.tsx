import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { TaskProvider } from "./context/TaskContext";
import Dashboard from "./pages/Dashboard";
import HtmlBuilder from "./pages/HtmlBuilder";
import NotFound from "./pages/NotFound";
import Footer from '@/components/Footer';
import AdminPage from './pages/Admin';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Router>
      <div className="min-h-screen flex flex-col">
        <main className="flex-grow">
          <TaskProvider>
            <TooltipProvider>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/builder" element={<HtmlBuilder />} />
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

export default App;
