import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StartScreen from './components/StartScreen';
import ConversationSession from './components/ConversationSession';

function App() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [settings, setSettings] = useState({
    duration: 60, // minutes - changed to 1 hour (60 minutes)
    selectedCategories: ['childhood', 'family', 'dreams', 'values', 'fun', 'current', 'reflection'],
    customCardsOnly: false, // New option for custom cards only mode
    musicUrls: [], // Changed to array for multiple URLs
    musicVolume: 0.3, // Added volume control (30% default)
    advertisements: {
      enabled: false,
      interval: 5, // Show ad every 5 cards
      ads: [] // Array of advertisement objects
    }
  });
  const [customCards, setCustomCards] = useState([]);

  // Load custom cards from localStorage on app start
  useEffect(() => {
    const savedCards = localStorage.getItem('customConversationCards');
    if (savedCards) {
      try {
        setCustomCards(JSON.parse(savedCards));
      } catch (error) {
        console.error('Error loading custom cards:', error);
      }
    }

    // Load settings from localStorage
    const savedSettings = localStorage.getItem('conversationSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        
        // Handle migration from single musicUrl to musicUrls array
        if (parsed.musicUrl && !parsed.musicUrls) {
          parsed.musicUrls = [parsed.musicUrl];
          delete parsed.musicUrl;
        }
        
        // Ensure advertisements object exists
        if (!parsed.advertisements) {
          parsed.advertisements = {
            enabled: false,
            interval: 5,
            ads: []
          };
        }
        
        // Ensure customCardsOnly exists
        if (parsed.customCardsOnly === undefined) {
          parsed.customCardsOnly = false;
        }
        
        setSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    }
  }, []);

  // Save custom cards to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('customConversationCards', JSON.stringify(customCards));
  }, [customCards]);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('conversationSettings', JSON.stringify(settings));
  }, [settings]);

  const handleStartSession = () => {
    setIsSessionActive(true);
  };

  const handleEndSession = () => {
    setIsSessionActive(false);
  };

  const handleSettingsChange = (newSettings) => {
    setSettings(newSettings);
  };

  const handleCustomCardsChange = (newCustomCards) => {
    setCustomCards(newCustomCards);
  };

  return (
    <div className="app">
      <AnimatePresence mode="wait">
        {!isSessionActive ? (
          <motion.div
            key="start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <StartScreen
              onStart={handleStartSession}
              settings={settings}
              onSettingsChange={handleSettingsChange}
              customCards={customCards}
              onCustomCardsChange={handleCustomCardsChange}
            />
          </motion.div>
        ) : (
          <motion.div
            key="session"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <ConversationSession
              settings={settings}
              onEndSession={handleEndSession}
              customCards={customCards}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;