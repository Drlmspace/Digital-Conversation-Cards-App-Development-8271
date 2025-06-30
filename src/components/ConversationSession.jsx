import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { getFilteredCards, shuffleArray, categories } from '../data/conversationCards';

const { FiPause, FiPlay, FiSquare, FiClock, FiRefreshCw, FiHeart, FiMusic, FiVolumeX, FiVolume2, FiSkipForward, FiAlertTriangle, FiSkipBack, FiEye, FiX, FiStar, FiDollarSign, FiExternalLink } = FiIcons;

const ConversationSession = ({ settings, onEndSession, customCards }) => {
  const [cards, setCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(settings.duration * 60);
  const [isPaused, setIsPaused] = useState(false);
  const [isEmergencyPause, setIsEmergencyPause] = useState(false);
  const [emergencyPauseTimeout, setEmergencyPauseTimeout] = useState(null);
  const [loopCount, setLoopCount] = useState(1);
  const [sessionStartTime] = useState(Date.now());
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [musicError, setMusicError] = useState('');
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [trackPlaylist, setTrackPlaylist] = useState([]);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [audioPlaybackError, setAudioPlaybackError] = useState('');
  const [currentTrackTitle, setCurrentTrackTitle] = useState('');

  // Inline Advertisement states
  const [isShowingAd, setIsShowingAd] = useState(false);
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [adTimeRemaining, setAdTimeRemaining] = useState(0);
  const [cardsSinceLastAd, setCardsSinceLastAd] = useState(0);
  const [totalCardsShown, setTotalCardsShown] = useState(0);
  const [currentAd, setCurrentAd] = useState(null);

  const audioRef = useRef(null);
  const embedRef = useRef(null);

  // Initialize and shuffle cards
  useEffect(() => {
    if (settings.customCardsOnly) {
      // Use only custom cards
      const shuffledCards = shuffleArray(customCards);
      setCards(shuffledCards);
    } else {
      // Use filtered cards + custom cards (original behavior)
      const filteredCards = getFilteredCards(settings.selectedCategories);
      const filteredCustomCards = customCards.filter(card =>
        settings.selectedCategories.includes(card.category)
      );
      const allCards = [...filteredCards, ...filteredCustomCards];
      const shuffledCards = shuffleArray(allCards);
      setCards(shuffledCards);
    }
  }, [settings.selectedCategories, settings.customCardsOnly, customCards]);

  // Initialize music playlist
  useEffect(() => {
    if (settings.musicUrls?.length > 0) {
      const validUrls = settings.musicUrls.filter(url => url.trim());
      setTrackPlaylist(validUrls);
      setCurrentTrackIndex(0);
    } else {
      setTrackPlaylist([]);
    }
  }, [settings.musicUrls]);

  // Check if ads are enabled and configured
  const adsEnabled = settings.advertisements?.enabled && 
                     settings.advertisements?.ads?.length > 0 && 
                     settings.advertisements?.interval > 0;

  // Determine if URL is a direct audio file
  const isDirectAudioFile = (url) => {
    return url.match(/\.(mp3|wav|ogg|m4a|aac|flac|wma|opus)(\?.*)?$/i);
  };

  // Determine if URL is a streaming service that needs iframe
  const isStreamingService = (url) => {
    return url.includes('youtube.com') || url.includes('youtu.be') || 
           url.includes('spotify.com') || url.includes('soundcloud.com') || 
           url.includes('apple.com') || url.includes('pandora.com') || 
           url.includes('deezer.com') || url.includes('tidal.com') || 
           url.includes('bandcamp.com') || url.includes('mixcloud.com');
  };

  // Get track title from URL
  const getTrackTitle = (url) => {
    try {
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        return 'YouTube Track';
      }
      if (url.includes('spotify.com')) {
        return 'Spotify Track';
      }
      if (url.includes('soundcloud.com')) {
        return 'SoundCloud Track';
      }
      if (url.includes('apple.com')) {
        return 'Apple Music Track';
      }
      if (url.includes('pandora.com')) {
        return 'Pandora Track';
      }
      if (url.includes('deezer.com')) {
        return 'Deezer Track';
      }
      if (url.includes('tidal.com')) {
        return 'Tidal Track';
      }
      if (url.includes('bandcamp.com')) {
        return 'Bandcamp Track';
      }
      if (url.includes('mixcloud.com')) {
        return 'Mixcloud Track';
      }
      if (isDirectAudioFile(url)) {
        const filename = url.split('/').pop().split('?')[0];
        return filename || 'Audio File';
      }
      // For generic URLs, try to extract domain name
      const domain = new URL(url).hostname.replace('www.', '');
      return `${domain.charAt(0).toUpperCase() + domain.slice(1)} Audio`;
    } catch {
      return 'Audio Track';
    }
  };

  // Convert URLs to embed format for streaming services
  const getEmbedUrl = (url) => {
    if (url.includes('youtube.com/watch')) {
      const videoId = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=0`;
    }
    if (url.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=0`;
    }
    if (url.includes('open.spotify.com')) {
      return url.replace('open.spotify.com', 'open.spotify.com/embed');
    }
    // For other streaming services or generic URLs, return as-is
    return url;
  };

  // Handle track end and move to next
  const handleTrackEnd = useCallback(() => {
    setCurrentTrackIndex(prev => {
      const nextIndex = prev + 1;
      return nextIndex >= trackPlaylist.length ? 0 : nextIndex;
    });
  }, [trackPlaylist.length]);

  // Setup audio for direct files
  const setupDirectAudio = useCallback(async (url) => {
    if (!audioRef.current) return;

    try {
      setIsAudioLoading(true);
      setAudioPlaybackError('');
      
      audioRef.current.src = url;
      audioRef.current.volume = isMusicMuted ? 0 : settings.musicVolume;
      audioRef.current.loop = false;

      // Add event listeners
      const onLoadStart = () => setIsAudioLoading(true);
      const onCanPlay = () => setIsAudioLoading(false);
      const onError = () => {
        setAudioPlaybackError(`Unable to load audio from ${getTrackTitle(url)}`);
        setIsAudioLoading(false);
        // Auto-skip to next track after 3 seconds
        setTimeout(handleTrackEnd, 3000);
      };
      const onEnded = handleTrackEnd;

      audioRef.current.addEventListener('loadstart', onLoadStart);
      audioRef.current.addEventListener('canplay', onCanPlay);
      audioRef.current.addEventListener('error', onError);
      audioRef.current.addEventListener('ended', onEnded);

      // Try to play
      await audioRef.current.play();

      // Cleanup function
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('loadstart', onLoadStart);
          audioRef.current.removeEventListener('canplay', onCanPlay);
          audioRef.current.removeEventListener('error', onError);
          audioRef.current.removeEventListener('ended', onEnded);
        }
      };
    } catch (error) {
      setAudioPlaybackError(`Failed to play ${getTrackTitle(url)}: ${error.message}`);
      setIsAudioLoading(false);
      console.error('Audio playback error:', error);
      // Auto-skip to next track
      setTimeout(handleTrackEnd, 3000);
    }
  }, [isMusicMuted, settings.musicVolume, handleTrackEnd]);

  // Music setup and management
  useEffect(() => {
    if (trackPlaylist.length === 0 || isPaused || isEmergencyPause) {
      return;
    }

    const currentUrl = trackPlaylist[currentTrackIndex];
    setCurrentTrackTitle(getTrackTitle(currentUrl));

    let cleanup;

    if (isDirectAudioFile(currentUrl)) {
      // Handle direct audio files
      setupDirectAudio(currentUrl).then(cleanupFn => {
        cleanup = cleanupFn;
      });
    } else {
      // Handle streaming services and generic URLs
      setMusicError('');
      setIsAudioLoading(false);
      setAudioPlaybackError('');

      if (isStreamingService(currentUrl)) {
        // Will be handled by iframe
      } else {
        // Generic URL - try as audio first, fallback to iframe
        if (audioRef.current) {
          setupDirectAudio(currentUrl).then(cleanupFn => {
            cleanup = cleanupFn;
          }).catch(() => {
            // If direct audio fails, it will be handled by iframe as fallback
            console.log('Direct audio failed, using iframe fallback');
          });
        }
      }
    }

    // Cleanup function
    return () => {
      if (cleanup) cleanup();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [trackPlaylist, currentTrackIndex, isPaused, isEmergencyPause, setupDirectAudio]);

  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMusicMuted ? 0 : settings.musicVolume;
    }
  }, [settings.musicVolume, isMusicMuted]);

  // Check if it's time to show an advertisement
  const shouldShowAd = useCallback(() => {
    if (!adsEnabled) return false;
    const interval = settings.advertisements.interval;
    // Check if we've shown enough cards since last ad
    return cardsSinceLastAd >= interval;
  }, [adsEnabled, settings.advertisements?.interval, cardsSinceLastAd]);

  // Show inline advertisement
  const showInlineAdvertisement = useCallback(() => {
    if (!adsEnabled || settings.advertisements.ads.length === 0) return;

    const ads = settings.advertisements.ads;
    const adToShow = ads[currentAdIndex % ads.length];
    
    setIsShowingAd(true);
    setCurrentAd(adToShow);
    setAdTimeRemaining(adToShow.duration);
    setCardsSinceLastAd(0);
    
    // Move to next ad for next time
    setCurrentAdIndex(prev => (prev + 1) % ads.length);
  }, [adsEnabled, settings.advertisements?.ads, currentAdIndex]);

  // End advertisement and return to cards
  const endAdvertisement = useCallback(() => {
    setIsShowingAd(false);
    setCurrentAd(null);
    setAdTimeRemaining(0);
  }, []);

  // Skip advertisement
  const skipAd = useCallback(() => {
    endAdvertisement();
  }, [endAdvertisement]);

  // Move to next card
  const moveToNextCard = useCallback(() => {
    // Check if we should show an ad before moving to next card
    if (shouldShowAd() && !isShowingAd) {
      showInlineAdvertisement();
      return;
    }

    // If we're showing an ad, end it first
    if (isShowingAd) {
      endAdvertisement();
      return;
    }

    setCurrentCardIndex((prevIndex) => {
      const nextIndex = prevIndex + 1;
      if (nextIndex >= cards.length) {
        // Start new loop
        setLoopCount(prev => prev + 1);
        const newShuffledCards = shuffleArray(cards);
        setCards(newShuffledCards);
        return 0;
      }
      return nextIndex;
    });

    setTotalCardsShown(prev => prev + 1);
    setCardsSinceLastAd(prev => prev + 1);
    setTimeRemaining(settings.duration * 60);
  }, [cards, settings.duration, shouldShowAd, showInlineAdvertisement, isShowingAd, endAdvertisement]);

  // Timer logic for cards and ads
  useEffect(() => {
    if (isPaused || (cards.length === 0 && !isShowingAd)) return;

    const interval = setInterval(() => {
      if (isShowingAd) {
        // Handle ad timer
        setAdTimeRemaining((prev) => {
          if (prev <= 1) {
            endAdvertisement();
            setTimeRemaining(settings.duration * 60);
            return 0;
          }
          return prev - 1;
        });
      } else {
        // Handle card timer
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            moveToNextCard();
            return settings.duration * 60;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPaused, cards.length, isShowingAd, settings.duration, moveToNextCard, endAdvertisement]);

  // Emergency pause auto-resume
  useEffect(() => {
    if (isEmergencyPause) {
      const timeout = setTimeout(() => {
        setIsEmergencyPause(false);
        setIsPaused(false);
      }, 30000); // 30 seconds

      setEmergencyPauseTimeout(timeout);

      return () => {
        if (timeout) clearTimeout(timeout);
      };
    }
  }, [isEmergencyPause]);

  const handleEmergencyPause = useCallback(() => {
    if (isEmergencyPause) {
      // Resume immediately
      setIsEmergencyPause(false);
      setIsPaused(false);
      if (emergencyPauseTimeout) {
        clearTimeout(emergencyPauseTimeout);
        setEmergencyPauseTimeout(null);
      }
    } else {
      // Start emergency pause
      setIsPaused(true);
      setIsEmergencyPause(true);
    }
  }, [isEmergencyPause, emergencyPauseTimeout]);

  const toggleMusicMute = () => {
    setIsMusicMuted(!isMusicMuted);
  };

  const skipToNextTrack = () => {
    if (trackPlaylist.length > 1) {
      setCurrentTrackIndex(prev => {
        const nextIndex = prev + 1;
        return nextIndex >= trackPlaylist.length ? 0 : nextIndex;
      });
    }
  };

  const handleEndSession = () => {
    // Stop music when ending session
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    onEndSession();
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getSessionDuration = () => {
    const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getProgressPercentage = () => {
    if (isShowingAd && currentAd) {
      return ((currentAd.duration - adTimeRemaining) / currentAd.duration) * 100;
    }
    const totalTime = settings.duration * 60;
    return ((totalTime - timeRemaining) / totalTime) * 100;
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

  if (cards.length === 0 && !isShowingAd) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-warm-50 flex items-center justify-center">
        <div className="text-center">
          <SafeIcon icon={FiRefreshCw} className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">
            {settings.customCardsOnly 
              ? 'No custom cards available for this session...' 
              : 'Preparing your conversation cards...'
            }
          </p>
          {settings.customCardsOnly && (
            <div className="mt-4">
              <button
                onClick={handleEndSession}
                className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-medium transition-all"
              >
                Return to Settings
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentCard = cards[currentCardIndex];
  const categoryInfo = currentCard ? categories[currentCard.category] : null;
  const currentUrl = trackPlaylist[currentTrackIndex];
  const shouldShowIframe = currentUrl && !isDirectAudioFile(currentUrl) && !isPaused && !isEmergencyPause;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-warm-50 flex flex-col relative">
      {/* Hidden audio element for direct audio files */}
      <audio ref={audioRef} preload="auto" />

      {/* Hidden iframe for streaming services and generic URLs */}
      {shouldShowIframe && (
        <div className="hidden">
          <iframe
            ref={embedRef}
            key={`${currentTrackIndex}-${currentUrl}`} // Force re-render when track changes
            src={getEmbedUrl(currentUrl)}
            width="0"
            height="0"
            frameBorder="0"
            allow="autoplay; encrypted-media; fullscreen"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            onError={() => {
              setMusicError(`Unable to load ${getTrackTitle(currentUrl)}`);
              setTimeout(handleTrackEnd, 3000);
            }}
          />
        </div>
      )}

      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          {/* Session Info */}
          <div className="flex items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <SafeIcon icon={FiClock} className="w-4 h-4" />
              <span>Session: {getSessionDuration()}</span>
            </div>
            {!isShowingAd && (
              <div className="hidden sm:flex items-center gap-2">
                <span>Card {currentCardIndex + 1} of {cards.length}</span>
                <span className="text-primary-600">(Loop {loopCount})</span>
              </div>
            )}
            {isShowingAd && (
              <div className="flex items-center gap-2">
                <SafeIcon icon={FiDollarSign} className="w-4 h-4 text-orange-600" />
                <span className="text-orange-600 font-medium">Advertisement</span>
              </div>
            )}
            {settings.customCardsOnly && !isShowingAd && (
              <div className="flex items-center gap-1">
                <SafeIcon icon={FiStar} className="w-4 h-4 text-yellow-600" />
                <span className="text-xs text-yellow-600 font-medium">Custom Only</span>
              </div>
            )}
            {categoryInfo && !isShowingAd && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${categoryInfo.color}`}>
                {categoryInfo.name}
                {currentCard.isCustom && (
                  <span className="ml-1 text-xs opacity-75">• Custom</span>
                )}
              </span>
            )}
            {adsEnabled && !isShowingAd && (
              <div className="flex items-center gap-1">
                <SafeIcon icon={FiEye} className="w-4 h-4 text-orange-600" />
                <span className="text-xs text-orange-600">
                  Ads: {totalCardsShown} cards • Next in {settings.advertisements.interval - cardsSinceLastAd}
                </span>
              </div>
            )}
            {trackPlaylist.length > 0 && (
              <div className="flex items-center gap-1">
                <SafeIcon icon={FiMusic} className="w-4 h-4 text-primary-600" />
                <span className="text-xs text-primary-600">
                  Track {currentTrackIndex + 1}/{trackPlaylist.length}
                </span>
                {isAudioLoading && (
                  <SafeIcon icon={FiRefreshCw} className="w-3 h-3 text-primary-600 animate-spin ml-1" />
                )}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* Music Controls */}
            {trackPlaylist.length > 0 && (
              <>
                <button
                  onClick={toggleMusicMute}
                  className="flex items-center gap-2 px-3 py-2 bg-primary-100 text-primary-700 hover:bg-primary-200 rounded-lg text-sm font-medium transition-all"
                  title={isMusicMuted ? 'Unmute Music' : 'Mute Music'}
                >
                  <SafeIcon icon={isMusicMuted ? FiVolumeX : FiVolume2} className="w-4 h-4" />
                </button>
                {trackPlaylist.length > 1 && (
                  <button
                    onClick={skipToNextTrack}
                    className="flex items-center gap-2 px-3 py-2 bg-primary-100 text-primary-700 hover:bg-primary-200 rounded-lg text-sm font-medium transition-all"
                    title="Skip to Next Track"
                  >
                    <SafeIcon icon={FiSkipForward} className="w-4 h-4" />
                  </button>
                )}
              </>
            )}

            {/* Skip Ad Button - only show during ads that allow skipping */}
            {isShowingAd && currentAd?.allowSkip && adTimeRemaining <= currentAd.duration - 5 && (
              <button
                onClick={skipAd}
                className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg text-sm font-medium transition-all"
              >
                <SafeIcon icon={FiSkipForward} className="w-4 h-4" />
                Skip Ad
              </button>
            )}

            <button
              onClick={handleEmergencyPause}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isEmergencyPause
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              }`}
            >
              <SafeIcon icon={isEmergencyPause ? FiPlay : FiPause} className="w-4 h-4" />
              {isEmergencyPause ? 'Resume' : 'Emergency Pause'}
            </button>

            <button
              onClick={handleEndSession}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm font-medium transition-all"
            >
              <SafeIcon icon={FiSquare} className="w-4 h-4" />
              End Session
            </button>
          </div>
        </div>
      </div>

      {/* Music Error */}
      {(musicError || audioPlaybackError) && (
        <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
          <div className="max-w-6xl mx-auto">
            <p className="text-yellow-800 text-sm flex items-center gap-2">
              <SafeIcon icon={FiAlertTriangle} className="w-4 h-4" />
              {musicError || audioPlaybackError}
              {isAudioLoading && <span className="text-xs">(Loading...)</span>}
            </p>
          </div>
        </div>
      )}

      {/* Now Playing */}
      {trackPlaylist.length > 0 && !isPaused && !isEmergencyPause && (
        <div className="bg-primary-50 border-b border-primary-200 px-4 py-2">
          <div className="max-w-6xl mx-auto">
            <p className="text-primary-800 text-sm flex items-center gap-2">
              <SafeIcon icon={FiMusic} className="w-4 h-4" />
              <span>Now Playing:</span>
              <span className="font-medium">{currentTrackTitle}</span>
              <span className="text-primary-600">
                ({currentTrackIndex + 1} of {trackPlaylist.length})
              </span>
              {isDirectAudioFile(currentUrl) && (
                <span className="text-xs bg-primary-200 text-primary-800 px-2 py-0.5 rounded">
                  Direct Audio
                </span>
              )}
              {!isDirectAudioFile(currentUrl) && !isStreamingService(currentUrl) && (
                <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded">
                  Generic URL
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Title Section */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-gray-100 px-4 py-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex justify-center mb-4">
            <div className={`p-3 rounded-full ${
              isShowingAd 
                ? 'bg-orange-600/10' 
                : settings.customCardsOnly 
                  ? 'bg-yellow-600/10' 
                  : 'bg-primary-600/10'
            }`}>
              <SafeIcon 
                icon={
                  isShowingAd 
                    ? FiDollarSign 
                    : settings.customCardsOnly 
                      ? FiStar 
                      : FiHeart
                } 
                className={`w-8 h-8 ${
                  isShowingAd 
                    ? 'text-orange-600' 
                    : settings.customCardsOnly 
                      ? 'text-yellow-600' 
                      : 'text-primary-600'
                }`} 
              />
            </div>
          </div>
          <h1 className={`text-3xl md:text-4xl font-bold bg-gradient-to-r ${
            isShowingAd 
              ? 'from-orange-600 to-orange-800' 
              : 'from-primary-600 to-primary-800'
          } bg-clip-text text-transparent mb-2`}>
            {isShowingAd 
              ? 'Advertisement' 
              : settings.customCardsOnly 
                ? 'Custom Cards Session' 
                : 'Start Once, Talk Forever'
            }
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {isShowingAd 
              ? 'Supporting the platform that brings families together through meaningful conversations.'
              : settings.customCardsOnly 
                ? 'Enjoying your personalized conversation cards designed specifically for your family.' 
                : 'Digital conversation cards that bring families together through meaningful dialogue. Set your preferences, press start, and let the conversations flow naturally.'
            }
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          {isEmergencyPause ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center bg-white/90 backdrop-blur-sm rounded-2xl p-12 shadow-xl border border-gray-200"
            >
              <SafeIcon icon={FiPause} className="w-16 h-16 text-yellow-600 mx-auto mb-6" />
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Session Paused</h2>
              <p className="text-lg text-gray-600 mb-6">
                The conversation will automatically resume in a moment, or you can resume manually.
              </p>
              <button
                onClick={handleEmergencyPause}
                className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center gap-2 mx-auto"
              >
                <SafeIcon icon={FiPlay} className="w-5 h-5" />
                Resume Now
              </button>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={isShowingAd ? `ad-${currentAd?.id}` : `card-${currentCard?.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="text-center"
              >
                {/* Card/Ad Content */}
                <div className={`backdrop-blur-sm rounded-2xl p-8 md:p-12 shadow-xl border mb-8 ${
                  isShowingAd 
                    ? 'bg-gradient-to-br from-orange-50/90 to-orange-100/90 border-orange-200' 
                    : 'bg-white/90 border-gray-200'
                }`}>
                  {isShowingAd && currentAd ? (
                    // Advertisement Content
                    <motion.div
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <div className="flex items-center justify-center gap-2 mb-6">
                        <SafeIcon icon={FiEye} className="w-6 h-6 text-orange-600" />
                        <span className="text-orange-600 font-medium text-lg">Sponsored Content</span>
                      </div>
                      
                      <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6">
                        {currentAd.title}
                      </h1>
                      
                      <div 
                        className="text-lg md:text-xl text-gray-700 leading-relaxed mb-8"
                        dangerouslySetInnerHTML={{ __html: currentAd.content }}
                      />

                      {currentAd.actionText && currentAd.actionUrl && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.4 }}
                          className="mb-6"
                        >
                          <a
                            href={currentAd.actionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
                          >
                            {currentAd.actionText}
                            <SafeIcon icon={FiExternalLink} className="w-5 h-5" />
                          </a>
                        </motion.div>
                      )}

                      <div className="text-sm text-gray-500">
                        Advertisement will end automatically in {formatTime(adTimeRemaining)}
                        {currentAd.allowSkip && adTimeRemaining <= currentAd.duration - 5 && (
                          <span className="block mt-2">
                            <button
                              onClick={skipAd}
                              className="text-orange-600 hover:text-orange-700 underline font-medium"
                            >
                              Skip this ad →
                            </button>
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    // Regular Card Content
                    <motion.h1
                      className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight"
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      {currentCard?.question}
                    </motion.h1>
                  )}
                  
                  {!isShowingAd && currentCard?.isCustom && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="mt-4"
                    >
                      <span className="inline-block bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                        {settings.customCardsOnly ? 'Your Custom Card' : 'Custom Card'}
                      </span>
                    </motion.div>
                  )}
                </div>

                {/* Timer Display */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className={`backdrop-blur-sm rounded-xl p-6 max-w-md mx-auto ${
                    isShowingAd 
                      ? 'bg-orange-50/70 border border-orange-200' 
                      : 'bg-white/70'
                  }`}
                >
                  <div className="flex items-center justify-center gap-4 mb-4">
                    <SafeIcon 
                      icon={isShowingAd ? FiEye : FiClock} 
                      className={`w-6 h-6 ${isShowingAd ? 'text-orange-600' : 'text-primary-600'}`} 
                    />
                    <span className="text-3xl font-bold text-gray-900">
                      {isShowingAd ? formatTime(adTimeRemaining) : formatTime(timeRemaining)}
                    </span>
                    {!isShowingAd && trackPlaylist.length > 0 && (
                      <SafeIcon 
                        icon={isMusicMuted ? FiVolumeX : FiMusic} 
                        className={`w-5 h-5 ${isMusicMuted ? 'text-gray-400' : 'text-primary-600'}`} 
                      />
                    )}
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      className={`h-2 rounded-full transition-all duration-1000 ${
                        isShowingAd ? 'bg-orange-600' : 'bg-primary-600'
                      }`}
                      style={{ width: `${getProgressPercentage()}%` }}
                    />
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-2">
                    {isShowingAd 
                      ? 'Advertisement time remaining'
                      : 'Time remaining for this conversation'
                    }
                  </p>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white/50 backdrop-blur-sm border-t border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto text-center text-sm text-gray-500">
          <p>
            {isShowingAd 
              ? `Advertisement ${currentAdIndex + 1} of ${settings.advertisements?.ads?.length || 0} • Supporting meaningful family conversations`
              : `Cards automatically rotate every ${formatDuration(settings.duration)} • Put the device down and focus on the conversation`
            }
            {!isShowingAd && trackPlaylist.length > 0 && (
              <span className="ml-2">• {trackPlaylist.length} track playlist enhances the experience</span>
            )}
            {!isShowingAd && adsEnabled && (
              <span className="ml-2 text-orange-600">• Inline ads every {settings.advertisements.interval} card{settings.advertisements.interval > 1 ? 's' : ''} support this platform</span>
            )}
            {!isShowingAd && settings.customCardsOnly && (
              <span className="ml-2 text-yellow-600">• Custom Cards Only Mode Active</span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConversationSession;