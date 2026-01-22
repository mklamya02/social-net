import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { userService } from '@/services/user.service';
import { updateUser, completeOnboarding } from '@/store/slices/authSlice';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const INTEREST_OPTIONS = [
  { id: 'tech', label: 'Technology', icon: '💻' },
  { id: 'gaming', label: 'Gaming', icon: '🎮' },
  { id: 'music', label: 'Music', icon: '🎵' },
  { id: 'sports', label: 'Sports', icon: '⚽' },
  { id: 'movies', label: 'Movies', icon: '🎬' },
  { id: 'art', label: 'Art', icon: '🎨' },
  { id: 'science', label: 'Science', icon: '🔬' },
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'food', label: 'Food', icon: '🍕' },
  { id: 'fashion', label: 'Fashion', icon: '✨' },
  { id: 'fitness', label: 'Fitness', icon: '💪' },
  { id: 'business', label: 'Business', icon: '📈' },
  { id: 'coding', label: 'Coding', icon: '👨‍💻' },
  { id: 'anime', label: 'Anime', icon: '🍥' },
  { id: 'photography', label: 'Photography', icon: '📷' },
  { id: 'nature', label: 'Nature', icon: '🌿' },
  { id: 'books', label: 'Books', icon: '📚' },
  { id: 'education', label: 'Education', icon: '🎓' },
  { id: 'memes', label: 'Memes', icon: '🤪' },
  { id: 'cars', label: 'Cars', icon: '🚗' },
  { id: 'design', label: 'Design', icon: '✒️' },
  { id: 'history', label: 'History', icon: '🏛️' },
  { id: 'news', label: 'News', icon: '📰' },
  { id: 'crypto', label: 'Crypto', icon: '🪙' },
];

export function InterestsPage() {
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user } = useSelector(state => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const toggleInterest = (id) => {
    setSelected(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id) 
        : [...prev, id]
    );
  };

  const handleContinue = async () => {
    if (selected.length === 0 || loading) return;

    try {
      setLoading(true);
      const response = await userService.saveInterests(selected);
      if (response) {
        dispatch(updateUser(response));
        dispatch(completeOnboarding());
        navigate('/');
      }
    } catch (error) {
      console.error('Failed to save interests:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] max-w-2xl mx-auto px-4 py-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black mb-3 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
          What are you interested in?
        </h1>
        <p className="text-muted-foreground text-lg">
          Pick at least one to personalize your feed. You can always change this later.
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3 mb-12">
        {INTEREST_OPTIONS.map((option) => {
          const isSelected = selected.includes(option.id);
          return (
            <button
              key={option.id}
              onClick={() => toggleInterest(option.id)}
              className={cn(
                "group relative flex items-center gap-3 px-6 py-4 rounded-2xl border-2 transition-all duration-300 active:scale-95",
                isSelected 
                  ? "bg-primary border-primary text-white shadow-lg shadow-primary/25 scale-105" 
                  : "bg-card border-border/50 hover:border-primary/50 text-foreground hover:bg-primary/5"
              )}
            >
              <span className="text-2xl">{option.icon}</span>
              <span className="font-bold text-base">{option.label}</span>
              {isSelected && (
                <div className="absolute -top-2 -right-2 bg-white text-primary rounded-full p-0.5 shadow-md">
                  <Check className="w-4 h-4" strokeWidth={3} />
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="sticky bottom-8 w-full flex justify-center mt-auto">
        <Button 
          size="lg"
          onClick={handleContinue}
          disabled={selected.length === 0 || loading}
          className="rounded-full px-12 py-7 text-lg font-black shadow-xl hover:shadow-primary/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
