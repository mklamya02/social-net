/**
 * main.jsx - The Entry Point of the React Application
 * 
 * This is where everything starts! Think of it as the "Power Button" of your app.
 * It connects all the major pieces together and renders them to the browser.
 */

// Core React imports
import React from 'react'; // The React library itself
import ReactDOM from 'react-dom/client'; // Allows React to talk to the browser's DOM

// State Management
import { Provider } from 'react-redux'; // Wraps the app to give all components access to Redux store
import store from '@/store'; // Our centralized state management (like a global database for the frontend)

// Routing
import { BrowserRouter } from 'react-router-dom'; // Enables navigation between pages without page reload

// Main App Component
import App from './App'; // The root component that contains all our pages and components

// Global Styles
import './index.css'; // Global CSS styles (Tailwind CSS is configured here)

/**
 * RENDER THE APPLICATION
 * 
 * This is the "ignition sequence":
 * 1. Find the HTML element with id="root" (in index.html)
 * 2. Create a React root there
 * 3. Render our app with all the wrappers
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  // StrictMode: Helps catch bugs during development (extra checks and warnings)
  <React.StrictMode>
    {/* Provider: Makes Redux store available to ALL components in the app */}
    <Provider store={store}>
      {/* BrowserRouter: Enables client-side routing (URL changes without page refresh) */}
      <BrowserRouter>
        {/* App: Our main component that contains all routes and pages */}
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>,
);
