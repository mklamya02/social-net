import { createSlice } from '@reduxjs/toolkit';

const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('theme');
    if (stored) return stored;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  }
  return 'light';
};

const initialState = {
  isAuthModalOpen: false,
  authModalView: 'login', // 'login' or 'signup'
  feedMode: 'public', // 'public' or 'following'
  theme: getInitialTheme(),
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', state.theme);
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('theme', state.theme);
    },
    openAuthModal: (state, action) => {
      state.isAuthModalOpen = true;
      if (action.payload) {
        state.authModalView = action.payload;
      }
    },
    closeAuthModal: (state) => {
      state.isAuthModalOpen = false;
    },
    setAuthModalView: (state, action) => {
      state.authModalView = action.payload;
    },
    toggleAuthModalView: (state) => {
      state.authModalView = state.authModalView === 'login' ? 'signup' : 'login';
    },
    setFeedMode: (state, action) => {
      state.feedMode = action.payload;
    },
  },
});

export const { openAuthModal, closeAuthModal, setAuthModalView, toggleAuthModalView, setFeedMode, toggleTheme, setTheme } = uiSlice.actions;

export default uiSlice.reducer;
