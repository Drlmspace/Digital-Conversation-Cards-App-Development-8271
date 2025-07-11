import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { categories } from '../data/conversationCards';

const { FiPlay, FiShield, FiHeart, FiUsers, FiClock, FiEye, FiEyeOff, FiPlus, FiTrash2, FiEdit3, FiMusic, FiVolume2, FiList, FiCheck, FiX, FiLink, FiHeadphones, FiTarget, FiStar, FiExternalLink, FiType, FiFileText, FiRefreshCw } = FiIcons;

const StartScreen = ({ onStart, settings, onSettingsChange, customCards, onCustomCardsChange }) => {
  const [showAdminPortal, setShowAdminPortal] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('settings');
  const [newCard, setNewCard] = useState({ question: '', category: 'childhood' });
  const [editingCard, setEditingCard] = useState(null);
  const [musicUrlErrors, setMusicUrlErrors] = useState({});
  const [newMusicUrl, setNewMusicUrl] = useState('');

  const ADMIN_CREDENTIALS = {
    username: 'GameMicey',
    password: 'RUReady25?'
  };

  const timeOptions = [
    { value: 2, label: '2 minutes' },
    { value: 3, label: '3 minutes' },
    { value: 4, label: '4 minutes' },
    { value: 5, label: '5 minutes' },
    { value: 6, label: '6 minutes' },
    { value: 8, label: '8 minutes' },
    { value: 10, label: '10 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 60, label: '1 hour' }
  ];

  // Get current title and description with defaults
  const getCurrentTitle = () => {
    return settings.customTitle || 'Start Once, Talk Forever';
  };

  const getCurrentDescription = () => {
    return settings.customDescription || 'Digital conversation cards that bring families together through meaningful dialogue. Set your preferences, press start, and let the conversations flow naturally.';
  };

  // Determine if URL is a direct audio file
  const isDirectAudioFile = (url) => {
    return url.match(/\.(mp3|wav|ogg|m4a|aac|flac|wma|opus)(\?.*)?$/i);
  };

  // Determine URL type for display
  const getUrlType = (url) => {
    if (isDirectAudioFile(url)) return 'direct';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('spotify.com')) return 'spotify';
    if (url.includes('soundcloud.com')) return 'soundcloud';
    if (url.includes('apple.com')) return 'apple';
    if (url.includes('pandora.com')) return 'pandora';
    if (url.includes('deezer.com')) return 'deezer';
    if (url.includes('tidal.com')) return 'tidal';
    if (url.includes('bandcamp.com')) return 'bandcamp';
    if (url.includes('mixcloud.com')) return 'mixcloud';
    return 'generic';
  };

  const handleAdminPortalClick = () => {
    if (isAuthenticated) {
      setShowAdminPortal(true);
    } else {
      setShowLogin(true);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginData.username === ADMIN_CREDENTIALS.username && loginData.password === ADMIN_CREDENTIALS.password) {
      setIsAuthenticated(true);
      setShowLogin(false);
      setShowAdminPortal(true);
      setLoginError('');
      setLoginData({ username: '', password: '' });
    } else {
      setLoginError('Invalid credentials. Please try again.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setShowAdminPortal(false);
    setLoginData({ username: '', password: '' });
    setLoginError('');
    setActiveTab('settings');
  };

  const handleCategoryToggle = (categoryKey) => {
    const newCategories = settings.selectedCategories.includes(categoryKey)
      ? settings.selectedCategories.filter(cat => cat !== categoryKey)
      : [...settings.selectedCategories, categoryKey];
    
    onSettingsChange({ ...settings, selectedCategories: newCategories });
  };

  const handleCustomOnlyToggle = (enabled) => {
    onSettingsChange({ ...settings, customCardsOnly: enabled });
  };

  const handleStartSession = () => {
    // Check if custom cards only is enabled
    if (settings.customCardsOnly) {
      if (customCards.length === 0) {
        alert('You have enabled "Custom Cards Only" but have no custom cards created. Please create some custom cards first or disable this option.');
        return;
      }
    } else {
      // Original validation for regular mode
      if (settings.selectedCategories.length === 0) {
        alert('Please select at least one category to begin the conversation session.');
        return;
      }
    }
    
    onStart();
  };

  const closeAllModals = () => {
    setShowAdminPortal(false);
    setShowLogin(false);
    setLoginError('');
    setActiveTab('settings');
    setNewCard({ question: '', category: 'childhood' });
    setEditingCard(null);
    setMusicUrlErrors({});
    setNewMusicUrl('');
  };

  const handleCreateCard = (e) => {
    e.preventDefault();
    if (!newCard.question.trim()) return;

    const card = {
      id: Date.now(),
      question: newCard.question.trim(),
      category: newCard.category,
      type: 'custom',
      isCustom: true
    };

    onCustomCardsChange([...customCards, card]);
    setNewCard({ question: '', category: 'childhood' });
  };

  const handleEditCard = (card) => {
    setEditingCard(card);
    setNewCard({ question: card.question, category: card.category });
  };

  const handleUpdateCard = (e) => {
    e.preventDefault();
    if (!newCard.question.trim() || !editingCard) return;

    const updatedCards = customCards.map(card =>
      card.id === editingCard.id
        ? { ...card, question: newCard.question.trim(), category: newCard.category }
        : card
    );

    onCustomCardsChange(updatedCards);
    setEditingCard(null);
    setNewCard({ question: '', category: 'childhood' });
  };

  const handleDeleteCard = (cardId) => {
    if (confirm('Are you sure you want to delete this custom card?')) {
      onCustomCardsChange(customCards.filter(card => card.id !== cardId));
    }
  };

  const cancelEdit = () => {
    setEditingCard(null);
    setNewCard({ question: '', category: 'childhood' });
  };

  const validateMusicUrl = (url, index) => {
    if (!url) return true; // Empty URL is valid

    try {
      new URL(url); // Basic URL validation
      // Clear error if valid
      setMusicUrlErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[index];
        return newErrors;
      });
      return true;
    } catch {
      setMusicUrlErrors(prev => ({
        ...prev,
        [index]: 'Please enter a valid URL'
      }));
      return false;
    }
  };

  const addMusicUrl = () => {
    if (!newMusicUrl.trim()) return;
    if (settings.musicUrls.length >= 10) {
      alert('Maximum of 10 music URLs allowed');
      return;
    }

    if (validateMusicUrl(newMusicUrl, 'new')) {
      const newUrls = [...settings.musicUrls, newMusicUrl.trim()];
      onSettingsChange({ ...settings, musicUrls: newUrls });
      setNewMusicUrl('');
    }
  };

  const removeMusicUrl = (index) => {
    const newUrls = settings.musicUrls.filter((_, i) => i !== index);
    onSettingsChange({ ...settings, musicUrls: newUrls });
    
    // Clear any error for this index
    setMusicUrlErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[index];
      return newErrors;
    });
  };

  const updateMusicUrl = (index, url) => {
    const newUrls = [...settings.musicUrls];
    newUrls[index] = url;
    onSettingsChange({ ...settings, musicUrls: newUrls });
  };

  const clearAllMusic = () => {
    onSettingsChange({ ...settings, musicUrls: [] });
    setMusicUrlErrors({});
    setNewMusicUrl('');
  };

  const handleFooterAdToggle = (enabled) => {
    const newSettings = {
      ...settings,
      footerAd: {
        enabled,
        text: settings.footerAd?.text || '',
        url: settings.footerAd?.url || '',
        linkText: settings.footerAd?.linkText || ''
      }
    };
    onSettingsChange(newSettings);
  };

  const updateFooterAd = (field, value) => {
    const newSettings = {
      ...settings,
      footerAd: {
        ...settings.footerAd,
        [field]: value
      }
    };
    onSettingsChange(newSettings);
  };

  const handleCustomTitleChange = (title) => {
    onSettingsChange({ ...settings, customTitle: title });
  };

  const handleCustomDescriptionChange = (description) => {
    onSettingsChange({ ...settings, customDescription: description });
  };

  const resetToDefaults = () => {
    if (confirm('Are you sure you want to reset the title and description to defaults?')) {
      onSettingsChange({ 
        ...settings, 
        customTitle: '', 
        customDescription: '' 
      });
    }
  };

  const getTotalCards = () => {
    if (settings.customCardsOnly) {
      return customCards.length;
    }
    return 150 + customCards.length;
  };

  const formatDuration = (minutes) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMins = minutes % 60;
      if (remainingMins === 0) {
        return `${hours} hour${hours > 1 ? 's' : ''}`;
      }
      return `${hours}h ${remainingMins}m`;
    }
    return `${minutes} minutes`;
  };

  const getMusicTitle = (url) => {
    try {
      const urlType = getUrlType(url);
      switch (urlType) {
        case 'direct':
          const filename = url.split('/').pop().split('?')[0];
          return filename || 'Audio File';
        case 'youtube': return 'YouTube Track';
        case 'spotify': return 'Spotify Track';
        case 'soundcloud': return 'SoundCloud Track';
        case 'apple': return 'Apple Music Track';
        case 'pandora': return 'Pandora Track';
        case 'deezer': return 'Deezer Track';
        case 'tidal': return 'Tidal Track';
        case 'bandcamp': return 'Bandcamp Track';
        case 'mixcloud': return 'Mixcloud Track';
        case 'generic':
          const domain = new URL(url).hostname.replace('www.', '');
          return `${domain.charAt(0).toUpperCase() + domain.slice(1)} Audio`;
        default: return 'Music Track';
      }
    } catch {
      return 'Music Track';
    }
  };

  const getUrlTypeIcon = (url) => {
    const urlType = getUrlType(url);
    switch (urlType) {
      case 'direct': return FiHeadphones;
      case 'youtube': return FiPlay;
      case 'spotify':
      case 'apple':
      case 'pandora':
      case 'deezer':
      case 'tidal':
      case 'soundcloud':
      case 'bandcamp':
      case 'mixcloud': return FiMusic;
      default: return FiLink;
    }
  };

  const getUrlTypeColor = (url) => {
    const urlType = getUrlType(url);
    switch (urlType) {
      case 'direct': return 'bg-green-100 text-green-700';
      case 'youtube': return 'bg-red-100 text-red-700';
      case 'spotify': return 'bg-green-100 text-green-700';
      case 'soundcloud': return 'bg-orange-100 text-orange-700';
      case 'apple': return 'bg-gray-100 text-gray-700';
      default: return 'bg-blue-100 text-blue-700';
    }
  };

  const getUrlTypeLabel = (url) => {
    const urlType = getUrlType(url);
    switch (urlType) {
      case 'direct': return 'Direct Audio';
      case 'youtube': return 'YouTube';
      case 'spotify': return 'Spotify';
      case 'soundcloud': return 'SoundCloud';
      case 'apple': return 'Apple Music';
      case 'pandora': return 'Pandora';
      case 'deezer': return 'Deezer';
      case 'tidal': return 'Tidal';
      case 'bandcamp': return 'Bandcamp';
      case 'mixcloud': return 'Mixcloud';
      case 'generic': return 'Generic URL';
      default: return 'Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-warm-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full"
      >
        {!showAdminPortal && !showLogin ? (
          <div className="text-center space-y-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-4"
            >
              <div className="flex justify-center mb-6">
                <div className="bg-primary-600 p-6 rounded-full shadow-lg">
                  <SafeIcon icon={FiHeart} className="w-12 h-12 text-white" />
                </div>
              </div>
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">
                {getCurrentTitle()}
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                {getCurrentDescription()}
              </p>
            </motion.div>

            {/* Custom Cards Only Warning */}
            {settings.customCardsOnly && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 max-w-2xl mx-auto"
              >
                <div className="flex items-center gap-3">
                  <SafeIcon icon={FiStar} className="w-6 h-6 text-yellow-600" />
                  <div className="text-left">
                    <p className="text-yellow-800 font-semibold">Custom Cards Only Mode</p>
                    <p className="text-yellow-700 text-sm">
                      Only your custom conversation cards will be used in this session.
                      {customCards.length === 0 && (
                        <span className="block text-red-600 font-medium mt-1">
                          ⚠️ No custom cards available! Please create some first.
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto"
            >
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <SafeIcon icon={FiUsers} className="w-8 h-8 text-primary-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-gray-900">{getTotalCards()}</div>
                <div className="text-sm text-gray-600">
                  {settings.customCardsOnly ? 'Custom Cards' : 'Conversation Cards'}
                  {!settings.customCardsOnly && customCards.length > 0 && (
                    <span className="block text-xs text-primary-600 mt-1">
                      +{customCards.length} custom
                    </span>
                  )}
                  {settings.customCardsOnly && (
                    <span className="block text-xs text-yellow-600 mt-1">
                      Custom Only Mode
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <SafeIcon icon={FiClock} className="w-8 h-8 text-primary-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-gray-900">{formatDuration(settings.duration)}</div>
                <div className="text-sm text-gray-600">Time per Card</div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <SafeIcon icon={settings.musicUrls?.length > 0 ? FiMusic : FiHeart} className="w-8 h-8 text-primary-600 mx-auto mb-3" />
                <div className="text-2xl font-bold text-gray-900">
                  {settings.customCardsOnly ? customCards.length : settings.selectedCategories.length}
                </div>
                <div className="text-sm text-gray-600">
                  {settings.customCardsOnly ? 'Active Custom Cards' : 'Active Categories'}
                  {settings.musicUrls?.length > 0 && (
                    <span className="block text-xs text-primary-600 mt-1">
                      + {settings.musicUrls.length} Audio Track{settings.musicUrls.length > 1 ? 's' : ''}
                    </span>
                  )}
                  {settings.footerAd?.enabled && settings.footerAd?.text && (
                    <span className="block text-xs text-blue-600 mt-1">
                      + Footer Advertisement
                    </span>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <button
                onClick={handleStartSession}
                className="bg-primary-600 hover:bg-primary-700 text-white px-12 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3 group"
              >
                <SafeIcon icon={FiPlay} className="w-6 h-6 group-hover:scale-110 transition-transform" />
                Start Conversation Session
              </button>

              <button
                onClick={handleAdminPortalClick}
                className="bg-white hover:bg-gray-50 text-gray-700 px-8 py-4 rounded-xl text-lg font-medium border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-3"
              >
                <SafeIcon icon={FiShield} className="w-5 h-5" />
                Admin Portal
              </button>
            </motion.div>

            {/* Quick Info */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center text-gray-500 max-w-lg mx-auto"
            >
              <p className="text-sm">
                Once started, cards will automatically rotate every {formatDuration(settings.duration)}. Perfect for family dinners, gatherings, and meaningful connections.
                {settings.footerAd?.enabled && settings.footerAd?.text && (
                  <span className="block mt-1 text-blue-600">
                    • Footer advertisement will appear below conversation cards to support this platform
                  </span>
                )}
              </p>
            </motion.div>
          </div>
        ) : showLogin ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto"
          >
            <div className="text-center mb-8">
              <div className="bg-primary-100 p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <SafeIcon icon={FiShield} className="w-8 h-8 text-primary-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Portal</h2>
              <p className="text-gray-600">Please enter your credentials to access settings</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  value={loginData.username}
                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  placeholder="Enter username"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all pr-12"
                    placeholder="Enter password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <SafeIcon icon={showPassword ? FiEyeOff : FiEye} className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-700 text-sm">{loginError}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-lg font-semibold transition-all duration-200"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={closeAllModals}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-medium transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8 max-w-6xl mx-auto"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="bg-primary-100 p-2 rounded-lg">
                  <SafeIcon icon={FiShield} className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Admin Portal</h2>
                  <p className="text-sm text-gray-600">Customize conversation settings, create custom cards, and manage branding</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLogout}
                  className="text-gray-400 hover:text-gray-600 transition-colors text-sm"
                >
                  Sign Out
                </button>
                <button
                  onClick={closeAllModals}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <SafeIcon icon={FiX} className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
              <button
                onClick={() => setActiveTab('branding')}
                className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === 'branding'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Title & Description
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === 'settings'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Settings
              </button>
              <button
                onClick={() => setActiveTab('custom-cards')}
                className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === 'custom-cards'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Custom Cards ({customCards.length})
              </button>
              <button
                onClick={() => setActiveTab('advertisement')}
                className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === 'advertisement'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Footer Advertisement
              </button>
            </div>

            {activeTab === 'branding' ? (
              <div className="space-y-8">
                {/* Custom Title & Description */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <SafeIcon icon={FiType} className="w-5 h-5 text-purple-600" />
                      Custom Title & Description
                    </h3>
                    <button
                      onClick={resetToDefaults}
                      className="text-purple-600 hover:text-purple-700 text-sm flex items-center gap-1"
                    >
                      <SafeIcon icon={FiRefreshCw} className="w-3 h-3" />
                      Reset to Defaults
                    </button>
                  </div>
                  <p className="text-sm text-gray-700 mb-6">
                    Customize the main title and description that appears on your start screen. Leave fields empty to use default text.
                  </p>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Title
                      </label>
                      <input
                        type="text"
                        value={settings.customTitle || ''}
                        onChange={(e) => handleCustomTitleChange(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                        placeholder="Start Once, Talk Forever"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This will replace the main headline on your start screen
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Custom Description
                      </label>
                      <textarea
                        value={settings.customDescription || ''}
                        onChange={(e) => handleCustomDescriptionChange(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                        placeholder="Digital conversation cards that bring families together through meaningful dialogue. Set your preferences, press start, and let the conversations flow naturally."
                        rows="4"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        This will replace the subtitle text below your main headline
                      </p>
                    </div>

                    {/* Live Preview */}
                    <div className="border-t pt-6">
                      <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                        <SafeIcon icon={FiEye} className="w-4 h-4" />
                        Live Preview
                      </h4>
                      <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
                        <div className="flex justify-center mb-4">
                          <div className="bg-primary-600 p-4 rounded-full shadow-sm">
                            <SafeIcon icon={FiHeart} className="w-8 h-8 text-white" />
                          </div>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent mb-4">
                          {getCurrentTitle()}
                        </h1>
                        <p className="text-gray-600 leading-relaxed max-w-md mx-auto">
                          {getCurrentDescription()}
                        </p>
                      </div>
                    </div>

                    {/* Character Counts */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-blue-700 font-medium">Title Length:</span>
                          <span className={`ml-2 ${getCurrentTitle().length > 50 ? 'text-orange-600' : 'text-blue-600'}`}>
                            {getCurrentTitle().length} characters
                            {getCurrentTitle().length > 50 && ' (Consider shortening for mobile)'}
                          </span>
                        </div>
                        <div>
                          <span className="text-blue-700 font-medium">Description Length:</span>
                          <span className={`ml-2 ${getCurrentDescription().length > 200 ? 'text-orange-600' : 'text-blue-600'}`}>
                            {getCurrentDescription().length} characters
                            {getCurrentDescription().length > 200 && ' (Consider shortening for clarity)'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === 'settings' ? (
              <div className="space-y-8">
                {/* Custom Cards Only Option */}
                <div className="bg-yellow-50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <SafeIcon icon={FiStar} className="w-5 h-5 text-yellow-600" />
                      Custom Cards Only Mode
                    </h3>
                    <button
                      onClick={() => handleCustomOnlyToggle(!settings.customCardsOnly)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        settings.customCardsOnly
                          ? 'bg-yellow-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {settings.customCardsOnly ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                  <div className="text-sm text-gray-700 space-y-2">
                    <p>
                      <strong>When enabled:</strong> Only your custom conversation cards will be used during sessions. All built-in categories will be ignored.
                    </p>
                    <p>
                      <strong>Perfect for:</strong> Personalized family sessions, specific themes, or when you want complete control over the conversation topics.
                    </p>
                    {settings.customCardsOnly && customCards.length === 0 && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                        <p className="text-red-700 font-medium">
                          ⚠️ You have no custom cards created yet! Please create some custom cards in the "Custom Cards" tab before starting a session, or disable this option.
                        </p>
                      </div>
                    )}
                    {settings.customCardsOnly && customCards.length > 0 && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-3">
                        <p className="text-green-700 font-medium">
                          ✓ Ready to use {customCards.length} custom card{customCards.length > 1 ? 's' : ''} in your session!
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timer Duration */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Timer Duration</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {timeOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => onSettingsChange({ ...settings, duration: option.value })}
                        className={`p-3 rounded-lg border-2 transition-all text-sm ${
                          settings.duration === option.value
                            ? 'border-primary-500 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Background Music Playlist */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <SafeIcon icon={FiList} className="w-5 h-5" />
                    Background Audio Playlist ({settings.musicUrls?.length || 0}/10)
                  </h3>
                  <div className="space-y-4">
                    {/* Add New Music URL */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Add Audio URL (Up to 10 tracks)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={newMusicUrl}
                          onChange={(e) => setNewMusicUrl(e.target.value)}
                          onBlur={() => newMusicUrl && validateMusicUrl(newMusicUrl, 'new')}
                          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                          placeholder="https://example.com/audio.mp3 or https://youtube.com/watch?v=..."
                          disabled={settings.musicUrls?.length >= 10}
                        />
                        <button
                          onClick={addMusicUrl}
                          disabled={!newMusicUrl.trim() || settings.musicUrls?.length >= 10}
                          className="px-4 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-all flex items-center gap-2"
                        >
                          <SafeIcon icon={FiPlus} className="w-4 h-4" />
                          Add
                        </button>
                      </div>
                      {musicUrlErrors['new'] && (
                        <p className="text-red-600 text-sm mt-2">{musicUrlErrors['new']}</p>
                      )}
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-blue-800 text-sm font-medium mb-2">✨ Enhanced Audio Support:</p>
                        <ul className="text-blue-700 text-xs space-y-1">
                          <li>• <strong>Direct Audio Files:</strong> .mp3, .wav, .ogg, .m4a, .aac, .flac, .wma, .opus</li>
                          <li>• <strong>Streaming Services:</strong> YouTube, Spotify, SoundCloud, Apple Music, etc.</li>
                          <li>• <strong>Generic URLs:</strong> Any audio URL will be attempted automatically</li>
                          <li>• <strong>Smart Fallback:</strong> If direct audio fails, iframe embedding is tried</li>
                        </ul>
                      </div>
                    </div>

                    {/* Current Playlist */}
                    {settings.musicUrls?.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-medium text-gray-900 flex items-center gap-2">
                            <SafeIcon icon={FiMusic} className="w-4 h-4" />
                            Current Playlist
                          </h4>
                          <button
                            onClick={clearAllMusic}
                            className="text-red-600 hover:text-red-700 text-sm flex items-center gap-1"
                          >
                            <SafeIcon icon={FiTrash2} className="w-3 h-3" />
                            Clear All
                          </button>
                        </div>
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                          {settings.musicUrls.map((url, index) => (
                            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded text-xs font-medium">
                                    Track {index + 1}
                                  </span>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getUrlTypeColor(url)}`}>
                                    <SafeIcon icon={getUrlTypeIcon(url)} className="w-3 h-3" />
                                    {getUrlTypeLabel(url)}
                                  </span>
                                  <span className="text-sm font-medium text-gray-700">
                                    {getMusicTitle(url)}
                                  </span>
                                </div>
                                <button
                                  onClick={() => removeMusicUrl(index)}
                                  className="text-red-500 hover:text-red-700 transition-colors"
                                  title="Remove track"
                                >
                                  <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                                </button>
                              </div>
                              <input
                                type="url"
                                value={url}
                                onChange={(e) => updateMusicUrl(index, e.target.value)}
                                onBlur={(e) => validateMusicUrl(e.target.value, index)}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                              />
                              {musicUrlErrors[index] && (
                                <p className="text-red-600 text-xs mt-1">{musicUrlErrors[index]}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Volume Control */}
                    {settings.musicUrls?.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <SafeIcon icon={FiVolume2} className="w-4 h-4" />
                          Volume ({Math.round(settings.musicVolume * 100)}%)
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={settings.musicVolume}
                          onChange={(e) => onSettingsChange({ ...settings, musicVolume: parseFloat(e.target.value) })}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>Mute</span>
                          <span>Low</span>
                          <span>Medium</span>
                          <span>High</span>
                          <span>Max</span>
                        </div>
                      </div>
                    )}

                    {/* Playlist Preview */}
                    {settings.musicUrls?.length > 0 && (
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <SafeIcon icon={FiList} className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700">Playlist Ready</span>
                        </div>
                        <div className="text-xs text-green-600 space-y-1">
                          <p>✓ {settings.musicUrls.length} track{settings.musicUrls.length > 1 ? 's' : ''} will play in sequence during conversation sessions</p>
                          <p>✓ Playlist will loop continuously until session ends</p>
                          <p>✓ Smart audio detection handles direct files and streaming services automatically</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {settings.musicUrls.map((url, index) => (
                              <span key={index} className={`px-2 py-1 rounded-full text-xs ${getUrlTypeColor(url)}`}>
                                {getUrlTypeLabel(url)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Categories - Only show if not in custom cards only mode */}
                {!settings.customCardsOnly && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Conversation Categories ({settings.selectedCategories.length} selected)
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {Object.entries(categories).map(([key, category]) => (
                        <div
                          key={key}
                          onClick={() => handleCategoryToggle(key)}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            settings.selectedCategories.includes(key)
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{category.name}</h4>
                              <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                            </div>
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                              settings.selectedCategories.includes(key)
                                ? 'border-primary-500 bg-primary-500'
                                : 'border-gray-300'
                            }`}>
                              {settings.selectedCategories.includes(key) && (
                                <SafeIcon icon={FiCheck} className="w-3 h-3 text-white" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : activeTab === 'custom-cards' ? (
              <div className="space-y-8">
                {/* Add New Card Form */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {editingCard ? 'Edit Custom Card' : 'Create New Custom Card'}
                  </h3>
                  <form onSubmit={editingCard ? handleUpdateCard : handleCreateCard} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question
                      </label>
                      <textarea
                        value={newCard.question}
                        onChange={(e) => setNewCard({ ...newCard, question: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                        placeholder="Enter your conversation question..."
                        rows="3"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        value={newCard.category}
                        onChange={(e) => setNewCard({ ...newCard, category: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      >
                        {Object.entries(categories).map(([key, category]) => (
                          <option key={key} value={key}>{category.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
                      >
                        <SafeIcon icon={editingCard ? FiEdit3 : FiPlus} className="w-4 h-4" />
                        {editingCard ? 'Update Card' : 'Add Card'}
                      </button>
                      {editingCard && (
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium transition-all duration-200"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* Custom Cards List */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Your Custom Cards ({customCards.length})
                  </h3>
                  {customCards.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <SafeIcon icon={FiPlus} className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No custom cards yet. Create your first one above!</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {customCards.map((card) => (
                        <div key={card.id} className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-gray-900 font-medium mb-2">{card.question}</p>
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${categories[card.category].color}`}>
                                {categories[card.category].name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <button
                                onClick={() => handleEditCard(card)}
                                className="text-gray-400 hover:text-primary-600 transition-colors"
                              >
                                <SafeIcon icon={FiEdit3} className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteCard(card.id)}
                                className="text-gray-400 hover:text-red-600 transition-colors"
                              >
                                <SafeIcon icon={FiTrash2} className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Footer Advertisement Toggle */}
                <div className="bg-blue-50 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <SafeIcon icon={FiEye} className="w-5 h-5 text-blue-600" />
                      Footer Advertisement
                    </h3>
                    <button
                      onClick={() => handleFooterAdToggle(!settings.footerAd?.enabled)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        settings.footerAd?.enabled
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {settings.footerAd?.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                  <p className="text-sm text-gray-700">
                    Display an advertisement section below conversation cards during game sessions. Perfect for promoting products, services, or messages without interrupting the conversation flow.
                  </p>
                </div>

                {/* Footer Advertisement Configuration */}
                {settings.footerAd?.enabled && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Configure Footer Advertisement</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Advertisement Text (HTML supported)
                        </label>
                        <textarea
                          value={settings.footerAd?.text || ''}
                          onChange={(e) => updateFooterAd('text', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                          placeholder="Enter your advertisement text... You can use HTML tags like <strong>, <em>, <br>, etc."
                          rows="4"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          HTML is supported. Use tags like &lt;strong&gt;, &lt;em&gt;, &lt;br&gt;, etc. for formatting.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Link Text (optional)
                          </label>
                          <input
                            type="text"
                            value={settings.footerAd?.linkText || ''}
                            onChange={(e) => updateFooterAd('linkText', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="e.g., Learn More, Visit Website, Shop Now"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Link URL (optional)
                          </label>
                          <input
                            type="url"
                            value={settings.footerAd?.url || ''}
                            onChange={(e) => updateFooterAd('url', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="https://example.com"
                          />
                        </div>
                      </div>

                      {/* Preview */}
                      {settings.footerAd?.text && (
                        <div className="border-t pt-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Preview:</h4>
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
                            <div className="text-center">
                              <div className="flex items-center justify-center gap-2 mb-2">
                                <SafeIcon icon={FiEye} className="w-4 h-4 text-blue-600" />
                                <span className="text-blue-600 font-medium text-xs">Advertisement</span>
                              </div>
                              <div className="text-gray-800 text-sm mb-3" dangerouslySetInnerHTML={{ __html: settings.footerAd.text }} />
                              {settings.footerAd.url && settings.footerAd.linkText && (
                                <div className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium">
                                  {settings.footerAd.linkText}
                                  <SafeIcon icon={FiExternalLink} className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200 mt-8">
              <button
                onClick={handleStartSession}
                disabled={settings.customCardsOnly ? customCards.length === 0 : settings.selectedCategories.length === 0}
                className="flex-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2"
              >
                <SafeIcon icon={FiPlay} className="w-5 h-5" />
                Start Session
              </button>
              <button
                onClick={closeAllModals}
                className="flex-1 sm:flex-none bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-xl font-medium transition-all duration-200"
              >
                Close Portal
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default StartScreen;