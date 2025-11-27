import { useEffect, useState } from 'react';

interface Quote {
  text: string;
  author: string;
  image: string;
}

const quotes: Quote[] = [
  {
    text: "Quality is not an act, it is a habit.",
    author: "Aristotle",
    image: ""
  },
  {
    text: "Excellence is doing ordinary things extraordinarily well.",
    author: "John W. Gardner",
    image: ""
  },
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
    image: ""
  },
  {
    text: "Strive not to be a success, but rather to be of value.",
    author: "Albert Einstein",
    image: ""
  },
  {
    text: "Small daily improvements over time lead to stunning results.",
    author: "Robin Sharma",
    image: ""
  },
  {
    text: "Success is the sum of small efforts repeated day in and day out.",
    author: "Robert Collier",
    image: ""
  },
  {
    text: "Attention to detail is the secret to success.",
    author: "John Wooden",
    image: ""
  },
  {
    text: "The difference between ordinary and extraordinary is that little extra.",
    author: "Jimmy Johnson",
    image: ""
  },
  {
    text: "Consistency is what transforms average into excellence.",
    author: "Unknown",
    image: ""
  },
  {
    text: "Your work is going to fill a large part of your life. Make it meaningful.",
    author: "Steve Jobs",
    image: ""
  },
  {
    text: "Perfection is not attainable, but if we chase perfection we can catch excellence.",
    author: "Vince Lombardi",
    image: ""
  },
  {
    text: "The secret of getting ahead is getting started.",
    author: "Mark Twain",
    image: ""
  },
  {
    text: "Don't watch the clock; do what it does. Keep going.",
    author: "Sam Levenson",
    image: ""
  },
  {
    text: "The harder you work for something, the greater you'll feel when you achieve it.",
    author: "Unknown",
    image: ""
  },
  {
    text: "Dream bigger. Do bigger.",
    author: "Unknown",
    image: ""
  },
  {
    text: "Focus on being productive instead of busy.",
    author: "Tim Ferriss",
    image: ""
  },
  {
    text: "The key to success is to focus on goals, not obstacles.",
    author: "Unknown",
    image: ""
  },
  {
    text: "Good things come to those who hustle.",
    author: "Anais Nin",
    image: ""
  },
  {
    text: "Your limitation—it's only your imagination.",
    author: "Unknown",
    image: ""
  },
  {
    text: "Push yourself, because no one else is going to do it for you.",
    author: "Unknown",
    image: ""
  },
  {
    text: "Great things never come from comfort zones.",
    author: "Unknown",
    image: ""
  },
  {
    text: "Success doesn't just find you. You have to go out and get it.",
    author: "Unknown",
    image: ""
  },
  {
    text: "The way to get started is to quit talking and begin doing.",
    author: "Walt Disney",
    image: ""
  },
  {
    text: "Don't wait for opportunity. Create it.",
    author: "Unknown",
    image: ""
  },
  {
    text: "Work hard in silence, let your success be the noise.",
    author: "Frank Ocean",
    image: ""
  }
];

export function MotivationalQuote() {
  const [currentQuote, setCurrentQuote] = useState<Quote>(quotes[0]);

  useEffect(() => {
    // Pick a random quote on mount and whenever the component updates
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setCurrentQuote(randomQuote);

    // Change quote every 30 seconds
    const interval = setInterval(() => {
      const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
      setCurrentQuote(randomQuote);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-lg border bg-card">
      {/* Content */}
      <div className="px-4 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 text-center">
        <blockquote className="text-base sm:text-lg md:text-xl font-semibold text-foreground mb-2 sm:mb-3 italic leading-relaxed">
          "{currentQuote.text}"
        </blockquote>
        <p className="text-xs sm:text-sm text-muted-foreground font-medium">
          — {currentQuote.author}
        </p>
      </div>
    </div>
  );
}

