// Redesigned GameLayout.jsx with Tailwind CSS - Part 1 (Mobile Responsive)
import React, { useState, useEffect, useMemo } from 'react';
import DungeonExplorer from './DungeonExplorer';
import InventoryShopPage from './InventoryShopPage';
import axios from 'axios';
import { getUserStats, getAvailableClasses, selectClass } from '../services/characterService';
import { computeTotalStats } from '../components/game/EquipmentPanel';
import { getUserEquipment } from "../services/inventoryShopService";

const PAGES = {
  DUNGEON: 'dungeon',
  INVENTORY: 'inventory'
};

const NarrativeIntro = ({ onComplete }) => {
    const [currentText, setCurrentText] = useState('');
    const [currentParagraph, setCurrentParagraph] = useState(0);
    const [showButton, setShowButton] = useState(false);
    
    // Concise prophecy narrative
    const narrativeParagraphs = [
      "A mystical sage foresaw humanity's future: technology would reach its peak, but humans would become infinitely lazy.",
      
      "The ability to plan, persist, and complete tasks would fade. Only those who master self-discipline can save humanity.",
      
      "These chosen few can venture into the Mind Palace Labyrinth—where willpower becomes reality.",
      
      "Within lie challenges representing the obstacles you face when completing tasks.",
      
      "Rich rewards await those who persevere.",
      
      "Are you ready to enter your Mind Palace?"
    ];
    
    // Typewriter effect for each paragraph
    useEffect(() => {
      if (currentParagraph < narrativeParagraphs.length) {
        const fullText = narrativeParagraphs[currentParagraph];
        let charIndex = 0;
        
        const typeWriter = setInterval(() => {
          if (charIndex <= fullText.length) {
            setCurrentText(fullText.slice(0, charIndex));
            charIndex++;
          } else {
            clearInterval(typeWriter);
            
            // Pause between paragraphs
            setTimeout(() => {
              setCurrentParagraph(prev => prev + 1);
              setCurrentText('');
            }, 800);
          }
        }, 40); // Moderate typing speed
        
        return () => clearInterval(typeWriter);
      } else {
        // All paragraphs complete, show button
        setTimeout(() => setShowButton(true), 1000);
      }
    }, [currentParagraph]);
    
    return (
      <div className="h-screen bg-[#0f0f0f] text-[#e0e0e0] font-mono overflow-hidden fixed inset-0">
        {/* Dark background */}
        <div className="absolute inset-0 bg-[#0f0f0f]"></div>
        
        <div className="relative z-10 h-full flex items-center justify-center px-4 sm:px-8">
          {/* Main content box */}
          <div className="bg-[#2c1810] border-2 sm:border-3 border-[#5d3494] rounded-xl p-6 sm:p-12 max-w-4xl w-full shadow-2xl">
            
            {/* Title */}
            <div className="text-center mb-8 sm:mb-12">
              <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-wider mb-2 sm:mb-4">
                TaskMasters
              </h1>
              <div className="text-lg sm:text-xl text-[#b89be6] tracking-wide">
                Mind Palace Initiative
              </div>
            </div>
            
            {/* Narrative content */}
            <div className="space-y-4 sm:space-y-6 text-center min-h-[200px] sm:min-h-[300px] flex flex-col justify-center">
              {narrativeParagraphs.map((paragraph, index) => {
                if (index > currentParagraph) return null;
                
                return (
                  <div key={index}>
                    <p className={`text-sm sm:text-lg leading-relaxed transition-all duration-500 ${
                      index === currentParagraph 
                        ? 'text-white' 
                        : 'text-[#b89be6] opacity-80'
                    }`}>
                      {index === currentParagraph ? (
                        <>
                          {currentText}
                          <span className="animate-pulse text-[#ffa726] ml-1">|</span>
                        </>
                      ) : (
                        paragraph
                      )}
                    </p>
                    
                    {/* Add spacing between sections */}
                    {index === 1 && index !== currentParagraph && (
                      <div className="my-6 sm:my-8">
                        <div className="w-16 sm:w-24 h-px bg-[#5d3494] mx-auto"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Call to action */}
            {showButton && (
              <div className="text-center mt-8 sm:mt-12 animate-fade-in">
                <button
                  onClick={onComplete}
                  className="px-8 sm:px-12 py-3 sm:py-4 bg-[#4c2a85] border-2 border-[#7e4ab8] rounded-lg text-white font-bold text-lg sm:text-xl transition-all duration-300 hover:bg-[#7e4ab8] hover:border-[#9866d4] hover:shadow-lg hover:shadow-[#7e4ab8]/30 hover:-translate-y-1"
                >
                  Enter the Mind Palace
                </button>
                
                <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-[#b89be6] opacity-70">
                  Your journey begins now
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* CSS for fade-in animation */}
        <style jsx>{`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .animate-fade-in {
            animation: fade-in 0.8s ease-out;
          }
        `}</style>
      </div>
    );
  };

export const GameLayout = () => {
  const [currentPage, setCurrentPage] = useState(PAGES.DUNGEON);
  const [gold, setGold] = useState(0);
  const [userInfo, setUserInfo] = useState(null);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);
  const [classes, setClasses] = useState([]);
  const [error, setError] = useState(null);
  const [equipment, setEquipment] = useState(null);
  const [selectedGender, setSelectedGender] = useState('male');
  const [showNarrative, setShowNarrative] = useState(false);
  const [narrativeComplete, setNarrativeComplete] = useState(false);
  const [taskLevel, setTaskLevel] = useState(0); // 新增：任务等级

  // Get token
  const token = userInfo?.token || null;
  
  useEffect(() => {
    const storedUserInfo = localStorage.getItem('userInfo');
    if (storedUserInfo) {
      const parsed = JSON.parse(storedUserInfo);
      setUserInfo(parsed);
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    getUserEquipment(token).then(data => setEquipment(data));
  }, [token]);

  // Initialize user data
  useEffect(() => {
  const initializeUser = async () => {
    if (!token) {
      setError('Please log in first');
      setLoading(false);
      return;
    }

    try {
      // Get user stats (dungeon character data)
      const stats = await getUserStats(token);
      console.log('User stats:', stats);
      
      setUserStats({
        ...stats,
        skills: stats.skills || []
      });
      
      // If user has no class, show narrative first
      if (!stats.hasClass) {
        console.log('User needs to select class, showing narrative first');
        setShowNarrative(true);  
        const classData = await getAvailableClasses(token);
        setClasses(classData.classes);
      }
        
      // Get user profile (including task level and gold)
      try {
        const res = await axios.get('/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setGold(res.data.gold || 0);
        setTaskLevel(res.data.level || 0); // 获取任务等级
        console.log('User task level:', res.data.level);
      } catch (profileErr) {
        console.error('Failed to get user profile:', profileErr);
      }
        
      setLoading(false);
    } catch (err) {
      console.error('Failed to initialize user data:', err);
      setError(err.message);
      setLoading(false);
    }
  };

    if (userInfo?.token) {
      initializeUser();
    }
  }, [userInfo?.token]);

  
  const handleNarrativeComplete = () => {
    setNarrativeComplete(true);
    setShowNarrative(false);
    setIsSelecting(true);
  };
  // Select class
  const handleClassSelect = async (classSlug) => {
  try {
    setLoading(true);
    const result = await selectClass(token, classSlug, selectedGender);
    
    setUserStats({ 
      ...userStats,
      ...result.class,
      hasClass: true,
      gender: selectedGender,
      baseStats: result.class.baseStats || userStats.baseStats 
    });
    

    setUserInfo(prev => ({
      ...prev,
      gender: selectedGender,
      images: result.class.images 
    }));
    
    setIsSelecting(false);
    setLoading(false);
  } catch (err) {
    setError(err.message);
    setLoading(false);
  }
};

  
  
  // Refresh gold
  const refreshGold = async () => {
    if (!token) return;
    try {
      const res = await axios.get('/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGold(res.data.gold || 0);
      setTaskLevel(res.data.level || 0); // 同时更新任务等级
    } catch (err) {
      console.error('Failed to refresh gold:', err);
    }
  };

  const fetchEquipment = async () => {
    if (!token) return;
    try {
      const equipData = await getUserEquipment(token);
      setEquipment(equipData);
    } catch (err) {
      console.error('Failed to fetch equipment', err);
    }
  };
  
  // 计算装备加成
  const bonusStats = useMemo(() => {
    return equipment ? computeTotalStats(equipment?.slots) : { hp: 0, attack: 0, defense: 0, magicPower: 0, speed: 0, critRate: 0, evasion: 0 }
  }, [equipment]);

  // 计算任务等级加成：每级增加5%基础属性
  const taskLevelBonus = useMemo(() => {
    const multiplier = 1 + (taskLevel * 0.05);
    return { multiplier, percentage: taskLevel * 5 };
  }, [taskLevel]);

  // 计算最终有效属性：基础属性 × 任务等级加成 + 装备加成
  const effectiveBaseStats = useMemo(() => {
    const base = userStats?.baseStats || {};
    const { multiplier } = taskLevelBonus;
    
    return Object.fromEntries(
      Object.entries(base).map(([key, val]) => [
        key,
        Math.floor(val * multiplier) + (bonusStats[key] || 0)
      ])
    );
  }, [userStats?.baseStats, taskLevelBonus, bonusStats]);
  const getPlayerAvatar = () => {
    if (userStats?.images && userStats?.gender) {
      const avatarPath = userStats.images[userStats.gender]?.avatar;
      if (avatarPath) {
        return (
          <img 
            src={`/Icon/characters/${avatarPath}`}
            alt={`${userStats.name} ${userStats.gender}`}
            className="w-full h-full object-cover rounded-lg"
            onError={(e) => {
              console.log('Character avatar loading failed, using emoji fallback');
              e.target.style.display = 'none';
              e.target.parentNode.innerHTML = getEmojiAvatar();
            }}
          />
        );
      }
    }
    
    return getEmojiAvatar();
  };

  const getEmojiAvatar = () => {
    const emojiMap = {
      'warrior': '⚔️',
      'mage': '🔮',
      'archer': '🏹',
      'rogue': '🗡️',
      'cleric': '✨'
    };
    
    return <span className="text-2xl">{emojiMap[userStats.slug] || '👤'}</span>;
  };

  // Show loading
  if (loading && !userStats) {
    return (
      <div className="min-h-screen bg-[#2c1810] text-[#e0e0e0] font-mono">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-3 border-white/30 border-t-[#ffa726] rounded-full animate-spin mx-auto mb-5"></div>
            <p className="text-white">Loading game...</p>
          </div>
        </div>
      </div>
    );
  }

  if (showNarrative && !narrativeComplete) {
    return <NarrativeIntro onComplete={handleNarrativeComplete} />;
  }

  // Class selection interface
  if (isSelecting && classes.length > 0) {
    return (
      <div className="min-h-screen bg-[#2c1810] text-[#e0e0e0] font-mono">
        <nav className="bg-[#4c2a85] border-b-4 border-[#6a3bab] py-3">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-white">TaskMasters</h1>
              <span className="text-xs text-[#b89be6]">Select Class</span>
            </div>
          </div>
        </nav>
        
        <div className="px-4 sm:px-5 py-6 sm:py-10 max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-2xl sm:text-3xl mb-2">🧙‍♂️ Choose Your Class</h2>
            <p className="text-base sm:text-lg text-[#b89be6] mb-6 sm:mb-8">Select a class and gender to begin your adventure:</p>
            
            {/* Gender selection */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-5 mb-5">
              <label className="text-sm sm:text-base font-bold">Select Gender:</label>
              <div className="flex gap-2">
                <button
                  className={`flex items-center gap-2 px-4 sm:px-5 py-2 bg-[#3a1f6b] border-2 border-[#5d3494] rounded-lg text-[#e0e0e0] cursor-pointer font-mono transition-all duration-300 hover:bg-[#5d3494] hover:-translate-y-0.5 ${
                    selectedGender === 'male' ? 'bg-[#7e4ab8] border-[#9866d4] shadow-[0_0_10px_rgba(126,74,184,0.5)]' : ''
                  }`}
                  onClick={() => setSelectedGender('male')}
                >
                  <span className="text-lg sm:text-xl">👨</span>
                  <span className="text-sm sm:text-base">Male</span>
                </button>
                <button
                  className={`flex items-center gap-2 px-4 sm:px-5 py-2 bg-[#3a1f6b] border-2 border-[#5d3494] rounded-lg text-[#e0e0e0] cursor-pointer font-mono transition-all duration-300 hover:bg-[#5d3494] hover:-translate-y-0.5 ${
                    selectedGender === 'female' ? 'bg-[#7e4ab8] border-[#9866d4] shadow-[0_0_10px_rgba(126,74,184,0.5)]' : ''
                  }`}
                  onClick={() => setSelectedGender('female')}
                >
                  <span className="text-lg sm:text-xl">👩</span>
                  <span className="text-sm sm:text-base">Female</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Responsive grid layout - 1 column on mobile, 2 on desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8 max-w-4xl mx-auto">
            {classes.map((characterClass) => (
              <div
                key={characterClass.slug}
                className="bg-[#3a1f6b] border-2 sm:border-3 border-[#5d3494] rounded-xl p-4 sm:p-6 cursor-pointer transition-all duration-300 relative overflow-hidden flex flex-col h-full hover:bg-[#5d3494] hover:-translate-y-1 hover:shadow-lg hover:shadow-black/40 hover:shadow-[0_0_20px_rgba(126,74,184,0.3)] hover:border-[#7e4ab8]"
                onClick={() => handleClassSelect(characterClass.slug)}
              >
                {/* Class avatar */}
                <div className="text-center mb-4 sm:mb-5">
                  <div className="w-16 sm:w-20 h-16 sm:h-20 mx-auto mb-3 sm:mb-4 rounded-full bg-[#4c2a85] border-2 sm:border-3 border-[#7e4ab8] flex items-center justify-center overflow-hidden">
                    {characterClass.images && characterClass.images[selectedGender] ? (
                      <img 
                        src={`/Icon/characters/${characterClass.images[selectedGender].avatar}`}
                        alt={`${characterClass.name} ${selectedGender}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl sm:text-4xl">
                        {characterClass.slug === 'warrior' && '⚔️'}
                        {characterClass.slug === 'mage' && '🔮'}
                        {characterClass.slug === 'archer' && '🏹'}
                        {characterClass.slug === 'rogue' && '🗡️'}
                        {!['warrior', 'mage', 'archer', 'rogue'].includes(characterClass.slug) && '👤'}
                      </span>
                    )}
                  </div>
                  <h3 className="text-white text-xl sm:text-2xl font-bold m-0">{characterClass.name}</h3>
                </div>
                
                <p className="text-[#b89be6] text-xs sm:text-sm text-center leading-relaxed m-0 mb-4 sm:mb-5 flex-grow">
                  {characterClass.description || 'A brave adventurer'}
                </p>
                
                {/* Base stats - responsive grid */}
                <div className="mb-4 sm:mb-5">
                  <h4 className="text-white text-sm sm:text-base m-0 mb-3 sm:mb-4 text-center">Base Stats:</h4>
                  <div className="grid grid-cols-2 gap-1">
                    <div className="flex justify-between items-center bg-white/10 px-2 py-1 rounded text-xs">
                      <span className="text-[#b89be6] font-medium flex items-center gap-1">❤️ HP</span>
                      <span className="text-white font-bold">{characterClass.baseStats?.hp || 0}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/10 px-2 py-1 rounded text-xs">
                      <span className="text-[#b89be6] font-medium flex items-center gap-1">⚔️ Attack</span>
                      <span className="text-white font-bold">{characterClass.baseStats?.attack || 0}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/10 px-2 py-1 rounded text-xs">
                      <span className="text-[#b89be6] font-medium flex items-center gap-1">🛡️ Defense</span>
                      <span className="text-white font-bold">{characterClass.baseStats?.defense || 0}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/10 px-2 py-1 rounded text-xs">
                      <span className="text-[#b89be6] font-medium flex items-center gap-1">✨ Magic</span>
                      <span className="text-white font-bold">{characterClass.baseStats?.magicPower || 0}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/10 px-2 py-1 rounded text-xs">
                      <span className="text-[#b89be6] font-medium flex items-center gap-1">💨 Speed</span>
                      <span className="text-white font-bold">{characterClass.baseStats?.speed || 0}</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/10 px-2 py-1 rounded text-xs">
                      <span className="text-[#b89be6] font-medium flex items-center gap-1">💥 Crit</span>
                      <span className="text-white font-bold">{characterClass.baseStats?.critRate || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center bg-white/10 px-2 py-1 rounded text-xs col-span-2">
                      <span className="text-[#b89be6] font-medium flex items-center gap-1">👻 Evasion</span>
                      <span className="text-white font-bold">{characterClass.baseStats?.evasion || 0}%</span>
                    </div>
                  </div>
                </div>
                
                {/* Default skills */}
                <div className="mb-4 sm:mb-5">
                  <h4 className="text-white text-sm sm:text-base m-0 mb-3 sm:mb-4 text-center">Initial Skills:</h4>
                  <div className="flex justify-center gap-2 flex-wrap">
                    {characterClass.skills && characterClass.skills.length > 0 ? (
                      characterClass.skills.map((skill) => (
                        <div 
                          key={skill.id} 
                          className="w-10 sm:w-11 h-10 sm:h-11 bg-[#4c2a85] border-2 border-[#7e4ab8] rounded-lg flex items-center justify-center cursor-pointer relative transition-all duration-300 overflow-hidden hover:bg-[#7e4ab8] hover:scale-110 hover:shadow-lg hover:shadow-black/30 group"
                        >
                          {skill.icon ? (
                            <img 
                              src={`/Icon/skills/${skill.icon}.png`}
                              alt={skill.name}
                              className="w-6 sm:w-7 h-6 sm:h-7 object-cover"
                            />
                          ) : (
                            <span className="text-lg sm:text-xl">✨</span>
                          )}
                          <div className="absolute bottom-[-80px] left-1/2 transform -translate-x-1/2 bg-[#2c1810] border-2 border-[#ffa726] rounded-lg px-3 py-2 whitespace-nowrap opacity-0 pointer-events-none transition-all duration-300 z-10 shadow-lg shadow-black/30 min-w-[200px] group-hover:opacity-100 group-hover:bottom-[-90px]">
                            <div className="text-[#ffa726] font-bold text-sm text-center">{skill.name}</div>
                            <div className="text-white text-xs max-w-[200px] whitespace-normal leading-normal mt-1 text-center">{skill.description}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-[#888] text-xs text-center py-2">No skill information available</div>
                    )}
                  </div>
                </div>
                
                <div className="bg-[#ffa726] text-[#2c1810] px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-center font-bold text-sm sm:text-base transition-all duration-300 mt-auto hover:bg-[#ffca60] hover:shadow-lg hover:shadow-[#ffa726]/30">
                  Select Class
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  // Main game interface
  return (
    <div className="min-h-screen bg-[#2c1810] font-mono text-[#e0e0e0]">
      {/* Top navigation bar */}
      <nav className="bg-[#4c2a85] border-b-4 border-[#6a3bab] py-3 shadow-lg shadow-black/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="flex flex-col gap-0.5 order-1 sm:order-1">
              <div className="flex items-center">
                <img src="/logo_mini.png" alt="TaskMasters" className="h-6 sm:h-8 w-auto mr-2" />
                <span 
                  onClick={() => window.location.href = '/tasks'} 
                  className="text-lg sm:text-xl font-bold text-white cursor-pointer"
                >
                  TaskMasters
                </span>
              </div>
            </div>
            
            {/* Navigation tabs - responsive */}
            <div className="flex w-full sm:w-auto bg-[#3a1f6b] p-1 rounded-lg border-2 border-[#5d3494] order-3 sm:order-2">
              <button
                className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-md font-mono font-medium text-xs sm:text-sm transition-all duration-200 flex-1 sm:flex-none ${
                  currentPage === PAGES.DUNGEON
                    ? 'bg-[#7e4ab8] text-white shadow-[inset_0_0_0_2px_#9866d4,_0_4px_8px_rgba(0,0,0,0.2)]'
                    : 'bg-transparent text-[#b89be6] hover:bg-[#5d3494] hover:text-white hover:-translate-y-px'
                }`}
                onClick={() => setCurrentPage(PAGES.DUNGEON)}
              >
                <div className="text-sm sm:text-base">⚔️</div>
                <span className="hidden sm:inline whitespace-nowrap">Dungeon Exploration</span>
                <span className="sm:hidden">Dungeon</span>
              </button>
              
              <button
                className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-md font-mono font-medium text-xs sm:text-sm transition-all duration-200 flex-1 sm:flex-none ${
                  currentPage === PAGES.INVENTORY
                    ? 'bg-[#7e4ab8] text-white shadow-[inset_0_0_0_2px_#9866d4,_0_4px_8px_rgba(0,0,0,0.2)]'
                    : 'bg-transparent text-[#b89be6] hover:bg-[#5d3494] hover:text-white hover:-translate-y-px'
                }`}
                onClick={() => setCurrentPage(PAGES.INVENTORY)}
              >
                <div className="text-sm sm:text-base">🎒</div>
                <span className="hidden sm:inline whitespace-nowrap">Inventory Shop</span>
                <span className="sm:hidden">Inventory</span>
              </button>
            </div>
            
            {/* User info section - responsive */}
            <div className="flex items-center gap-2 sm:gap-3 order-2 sm:order-3">
              <div className="flex items-center gap-1 sm:gap-1.5 bg-[#ffb74d] rounded-lg px-2 sm:px-3 py-2 text-[#2c1810] font-bold text-xs sm:text-sm border-2 border-[#ff8f00] shadow-md shadow-black/20">
                <span className="text-sm sm:text-base">🪙</span>
                <span>{gold}</span>
              </div>
              {userInfo && (
                <div className="flex items-center gap-1 sm:gap-2 bg-[#5d3494] rounded-lg px-2 sm:px-3 py-2 border-2 border-[#7e4ab8] shadow-md shadow-black/20">
                  <div className="w-5 sm:w-6 h-5 sm:h-6 rounded bg-[#7e4ab8] flex items-center justify-center text-xs sm:text-sm border border-[#9866d4]">👤</div>
                  <span className="text-xs font-medium text-[#e0e0e0] hidden sm:inline">{userInfo.username}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Character status bar - always visible - responsive */}
      {userStats?.hasClass && (
        <div className="bg-[#f5f5f5] border-b-3 border-[#7e4ab8] py-2 sm:py-3 text-[#2c1810] shadow-md shadow-black/10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            {/* Mobile layout - vertical stack */}
            <div className="block sm:hidden">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-[#4c2a85] rounded-lg flex items-center justify-center text-xl border-2 border-[#5d3494] text-white">
                  {getPlayerAvatar()}
                </div>
                
                <div className="flex-1">
                  <h3 className="text-base font-bold m-0">{userStats.name}</h3>
                  <div className="text-xs text-[#666] m-0 mt-1">
                    <div>DungeonLevel: {userStats.level || 1} | EXP: {userStats.exp || 0}</div>
                    <div className="text-[#4caf50] font-bold">
                      TaskLevel: {taskLevel} {taskLevel > 0 && `(+${taskLevelBonus.percentage}% Stats)`}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Stats grid for mobile - 4 columns */}
              <div className="grid grid-cols-4 gap-1">
                <div className="text-center p-1.5 bg-[#e8e8e8] rounded border border-[#ccc] relative">
                  <span className="block text-xs text-[#666] font-medium">HP</span>
                  <span className="block text-sm font-bold text-[#333] mt-0.5">
                    {effectiveBaseStats.hp}
                    {taskLevel > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 text-xs text-[#4caf50] font-bold">+</span>
                    )}
                  </span>
                </div>
                <div className="text-center p-1.5 bg-[#e8e8e8] rounded border border-[#ccc] relative">
                  <span className="block text-xs text-[#666] font-medium">ATK</span>
                  <span className="block text-sm font-bold text-[#333] mt-0.5">
                    {effectiveBaseStats.attack}
                    {taskLevel > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 text-xs text-[#4caf50] font-bold">+</span>
                    )}
                  </span>
                </div>
                <div className="text-center p-1.5 bg-[#e8e8e8] rounded border border-[#ccc] relative">
                  <span className="block text-xs text-[#666] font-medium">DEF</span>
                  <span className="block text-sm font-bold text-[#333] mt-0.5">
                    {effectiveBaseStats.defense}
                    {taskLevel > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 text-xs text-[#4caf50] font-bold">+</span>
                    )}
                  </span>
                </div>
                <div className="text-center p-1.5 bg-[#e8e8e8] rounded border border-[#ccc] relative">
                  <span className="block text-xs text-[#666] font-medium">MAG</span>
                  <span className="block text-sm font-bold text-[#333] mt-0.5">
                    {effectiveBaseStats.magicPower}
                    {taskLevel > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 text-xs text-[#4caf50] font-bold">+</span>
                    )}
                  </span>
                </div>
                <div className="text-center p-1.5 bg-[#e8e8e8] rounded border border-[#ccc] relative">
                  <span className="block text-xs text-[#666] font-medium">SPD</span>
                  <span className="block text-sm font-bold text-[#333] mt-0.5">
                    {effectiveBaseStats.speed}
                    {taskLevel > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 text-xs text-[#4caf50] font-bold">+</span>
                    )}
                  </span>
                </div>
                <div className="text-center p-1.5 bg-[#e8e8e8] rounded border border-[#ccc] relative">
                  <span className="block text-xs text-[#666] font-medium">CRIT</span>
                  <span className="block text-sm font-bold text-[#333] mt-0.5">
                    {effectiveBaseStats.critRate}
                    {taskLevel > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 text-xs text-[#4caf50] font-bold">+</span>
                    )}
                  </span>
                </div>
                <div className="text-center p-1.5 bg-[#e8e8e8] rounded border border-[#ccc] relative col-span-2">
                  <span className="block text-xs text-[#666] font-medium">EVA</span>
                  <span className="block text-sm font-bold text-[#333] mt-0.5">
                    {effectiveBaseStats.evasion}
                    {taskLevel > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 text-xs text-[#4caf50] font-bold">+</span>
                    )}
                  </span>
                </div>
              </div>
              
              {/* Unspent points for mobile */}
              {userStats.unspentPoints > 0 && (
                <div className="flex items-center justify-center gap-2 bg-[#4caf50] text-white px-3 py-2 rounded-lg font-bold border-2 border-[#388e3c] shadow-md shadow-black/10 mt-3">
                  <span className="text-sm">💪</span>
                  <span className="text-xs">Available Points: {userStats.unspentPoints}</span>
                </div>
              )}
            </div>
            
            {/* Desktop layout - horizontal */}
            <div className="hidden sm:flex items-center justify-between gap-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-[#4c2a85] rounded-lg flex items-center justify-center text-2xl border-2 border-[#5d3494] text-white">
                  {getPlayerAvatar()}
                </div>
                
                <div>
                  <h3 className="text-lg font-bold m-0">{userStats.name}</h3>
                  <div className="text-sm text-[#666] m-0 mt-1 flex items-center gap-4">
                    <span>DungeonLevel: {userStats.level || 1} | EXP: {userStats.exp || 0}</span>
                    <span className="text-[#4caf50] font-bold">
                      TaskLevel: {taskLevel} {taskLevel > 0 && `(+${taskLevelBonus.percentage}% Stats)`}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="text-center w-16 px-3 py-1.5 bg-[#e8e8e8] rounded border border-[#ccc] relative">
                  <span className="block text-xs text-[#666] font-medium">HP</span>
                  <span className="block text-base font-bold text-[#333] mt-0.5">
                    {effectiveBaseStats.hp}
                    {taskLevel > 0 && (
                      <span className="absolute -top-1 -right-1 text-xs text-[#4caf50] font-bold">+</span>
                    )}
                  </span>
                </div>
                <div className="text-center w-16 px-3 py-1.5 bg-[#e8e8e8] rounded border border-[#ccc] relative">
                  <span className="block text-xs text-[#666] font-medium">ATK</span>
                  <span className="block text-base font-bold text-[#333] mt-0.5">
                    {effectiveBaseStats.attack}
                    {taskLevel > 0 && (
                      <span className="absolute -top-1 -right-1 text-xs text-[#4caf50] font-bold">+</span>
                    )}
                  </span>
                </div>
                <div className="text-center w-16 px-3 py-1.5 bg-[#e8e8e8] rounded border border-[#ccc] relative">
                  <span className="block text-xs text-[#666] font-medium">DEF</span>
                  <span className="block text-base font-bold text-[#333] mt-0.5">
                    {effectiveBaseStats.defense}
                    {taskLevel > 0 && (
                      <span className="absolute -top-1 -right-1 text-xs text-[#4caf50] font-bold">+</span>
                    )}
                  </span>
                </div>
                <div className="text-center w-16 px-3 py-1.5 bg-[#e8e8e8] rounded border border-[#ccc] relative">
                  <span className="block text-xs text-[#666] font-medium">MAG</span>
                  <span className="block text-base font-bold text-[#333] mt-0.5">
                    {effectiveBaseStats.magicPower}
                    {taskLevel > 0 && (
                      <span className="absolute -top-1 -right-1 text-xs text-[#4caf50] font-bold">+</span>
                    )}
                  </span>
                </div>
                <div className="text-center w-16 px-3 py-1.5 bg-[#e8e8e8] rounded border border-[#ccc] relative">
                  <span className="block text-xs text-[#666] font-medium">SPD</span>
                  <span className="block text-base font-bold text-[#333] mt-0.5">
                    {effectiveBaseStats.speed}
                    {taskLevel > 0 && (
                      <span className="absolute -top-1 -right-1 text-xs text-[#4caf50] font-bold">+</span>
                    )}
                  </span>
                </div>
                <div className="text-center w-16 px-3 py-1.5 bg-[#e8e8e8] rounded border border-[#ccc] relative">
                  <span className="block text-xs text-[#666] font-medium">CRIT</span>
                  <span className="block text-base font-bold text-[#333] mt-0.5">
                    {effectiveBaseStats.critRate}
                    {taskLevel > 0 && (
                      <span className="absolute -top-1 -right-1 text-xs text-[#4caf50] font-bold">+</span>
                    )}
                  </span>
                </div>
                <div className="text-center w-16 px-3 py-1.5 bg-[#e8e8e8] rounded border border-[#ccc] relative">
                  <span className="block text-xs text-[#666] font-medium">EVA</span>
                  <span className="block text-base font-bold text-[#333] mt-0.5">
                    {effectiveBaseStats.evasion}
                    {taskLevel > 0 && (
                      <span className="absolute -top-1 -right-1 text-xs text-[#4caf50] font-bold">+</span>
                    )}
                  </span>
                </div>
              </div>
              
              {userStats.unspentPoints > 0 && (
                <div className="flex items-center gap-2 bg-[#4caf50] text-white px-4 py-2 rounded-lg font-bold border-2 border-[#388e3c] shadow-md shadow-black/10">
                  <span className="text-base">💪</span>
                  <span className="text-sm">Available Stat Points: {userStats.unspentPoints}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Main content area */}
      <main className="min-h-[calc(100vh-200px)] bg-[#1a0f12] p-2 sm:p-4" 
        style={{
          backgroundImage: `
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Cg fill='%238b5cf6' fill-opacity='0.08'%3E%3Ccircle cx='100' cy='100' r='1.5'/%3E%3Ccircle cx='200' cy='150' r='1.5'/%3E%3Ccircle cx='150' cy='250' r='1.5'/%3E%3Ccircle cx='280' cy='210' r='1.5'/%3E%3Ccircle cx='300' cy='100' r='1.5'/%3E%3Cpath d='M100 100L200 150L150 250L280 210L300 100' stroke='%238b5cf6' stroke-width='0.5' stroke-opacity='0.05' fill='none'/%3E%3C/g%3E%3C/svg%3E"),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='104' viewBox='0 0 60 104'%3E%3Cpath d='M30 10.9L0 38.1V76.5L30 103.7L60 76.5V38.1L30 10.9zM30 0L60 17.3V52L30 69.3L0 52V17.3L30 0z' fill='none' stroke='%238b5cf6' stroke-opacity='0.07' stroke-width='1.5'/%3E%3C/svg%3E")
          `,
          backgroundSize: "400px 400px, 60px 104px",
          backgroundPosition: "center center, center center",
        }}
      >
        <div className={`mx-auto ${
          currentPage === PAGES.DUNGEON 
            ? 'max-w-3xl' 
            : 'max-w-6xl bg-[#21141e] bg-opacity-90 backdrop-blur-sm rounded-xl border-3 border-[#7e4ab8] p-2 sm:p-4 text-[#e0e0e0] shadow-lg shadow-black/30'
        }`}>
          {currentPage === PAGES.DUNGEON && (
            <DungeonExplorer
              userStats={{
                ...userStats,
                baseStats: effectiveBaseStats
              }}
              onGoldUpdate={refreshGold}
              gold={gold}
            />
          )}
          {currentPage === PAGES.INVENTORY && (
            <InventoryShopPage onEquipmentChange={fetchEquipment} />
          )}
        </div>
      </main>
      {/* Responsive design styles */}
      <style jsx>{`
        @media (max-width: 1024px) {
          .status-container {
            flex-direction: column;
            gap: 12px;
          }
          
          .character-stats {
            flex-wrap: wrap;
            justify-content: center;
          }
        }

        @media (max-width: 768px) {
          .nav-container {
            flex-direction: column;
            gap: 12px;
            padding: 0 12px;
          }
          
          .nav-tabs {
            order: 2;
            width: 100%;
            justify-content: center;
          }
          
          .brand {
            order: 1;
            text-align: center;
          }
          
          .user-section {
            order: 3;
            width: 100%;
            justify-content: center;
          }
          
          .tab-label {
            display: none;
          }
          
          .character-stats {
            gap: 8px;
          }
          
          .stat-item {
            padding: 4px 8px;
            font-size: 12px;
          }

          /* Mobile-specific adjustments */
          .mobile-stats-grid {
            grid-template-columns: repeat(4, 1fr);
            gap: 4px;
          }

          .mobile-stats-grid .stat-col-span-2 {
            grid-column: span 2;
          }

          .mobile-nav-button {
            min-height: 44px; /* iOS recommended touch target */
          }

          .mobile-character-info {
            padding: 8px 0;
          }

          .mobile-character-avatar {
            width: 40px;
            height: 40px;
          }

          .mobile-stat-card {
            min-height: 50px;
            padding: 6px;
          }

          /* Ensure tooltips work well on mobile */
          .skill-tooltip {
            position: fixed;
            z-index: 50;
            max-width: 250px;
            transform: translateX(-50%);
          }

          /* Class selection mobile grid */
          .class-grid-mobile {
            grid-template-columns: 1fr;
            gap: 16px;
          }

          .class-card-mobile {
            max-width: none;
            width: 100%;
          }

          /* Mobile-friendly skill icons */
          .skill-icon-mobile {
            width: 40px;
            height: 40px;
          }

          /* Responsive text sizes for mobile */
          .text-responsive-lg {
            font-size: 16px;
          }

          .text-responsive-base {
            font-size: 14px;
          }

          .text-responsive-sm {
            font-size: 12px;
          }

          .text-responsive-xs {
            font-size: 11px;
          }

          /* Mobile padding adjustments */
          .mobile-padding {
            padding: 12px;
          }

          .mobile-margin {
            margin: 8px 0;
          }

          /* Ensure buttons are touch-friendly */
          .mobile-touch-target {
            min-height: 44px;
            min-width: 44px;
          }

          /* Mobile scroll improvements */
          .mobile-scroll {
            -webkit-overflow-scrolling: touch;
          }

          /* Character status mobile layout improvements */
          .character-status-mobile {
            padding: 12px 16px;
          }

          .character-info-mobile {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }

          .character-name-mobile {
            font-size: 16px;
            font-weight: bold;
          }

          .character-level-mobile {
            font-size: 11px;
            color: #666;
          }

          /* Mobile navigation improvements */
          .nav-mobile {
            padding: 12px 16px;
          }

          .nav-tabs-mobile {
            display: flex;
            width: 100%;
            background: #3a1f6b;
            border-radius: 8px;
            padding: 4px;
            border: 2px solid #5d3494;
          }

          .nav-tab-mobile {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 10px;
            border-radius: 6px;
            font-size: 13px;
            font-weight: 500;
            transition: all 0.2s;
          }

          .nav-tab-active-mobile {
            background: #7e4ab8;
            color: white;
            box-shadow: inset 0 0 0 2px #9866d4, 0 4px 8px rgba(0,0,0,0.2);
          }

          .nav-tab-inactive-mobile {
            background: transparent;
            color: #b89be6;
          }

          .nav-tab-inactive-mobile:hover {
            background: #5d3494;
            color: white;
          }

          /* Gold and user info mobile */
          .user-info-mobile {
            display: flex;
            align-items: center;
            gap: 8px;
            justify-content: center;
            margin-top: 8px;
          }

          .gold-display-mobile {
            display: flex;
            align-items: center;
            gap: 4px;
            background: #ffb74d;
            border-radius: 6px;
            padding: 6px 10px;
            color: #2c1810;
            font-weight: bold;
            font-size: 13px;
            border: 2px solid #ff8f00;
          }

          .user-avatar-mobile {
            display: flex;
            align-items: center;
            gap: 4px;
            background: #5d3494;
            border-radius: 6px;
            padding: 6px 10px;
            border: 2px solid #7e4ab8;
          }

          .user-avatar-icon-mobile {
            width: 20px;
            height: 20px;
            background: #7e4ab8;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            border: 1px solid #9866d4;
          }
        }

        /* Tablet adjustments */
        @media (min-width: 768px) and (max-width: 1024px) {
          .character-stats {
            gap: 12px;
          }

          .stat-item {
            width: 60px;
            padding: 8px 12px;
          }

          .nav-tabs {
            gap: 8px;
          }

          .nav-tab {
            padding: 8px 16px;
          }
        }

        /* Large screen optimizations */
        @media (min-width: 1440px) {
          .max-w-6xl {
            max-width: 80rem;
          }

          .character-stats {
            gap: 24px;
          }

          .stat-item {
            width: 72px;
            padding: 12px 16px;
          }
        }

        /* Print styles (if needed) */
        @media print {
          .bg-pattern,
          .shadow-lg,
          .shadow-md {
            display: none !important;
          }

          .border-4,
          .border-3,
          .border-2 {
            border-width: 1px !important;
          }
        }

        /* Dark mode support (if implementing theme toggle later) */
        @media (prefers-color-scheme: dark) {
          /* Already using dark theme, but can add overrides here */
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .border-[#5d3494] {
            border-color: #ffffff;
          }

          .text-[#b89be6] {
            color: #ffffff;
          }

          .bg-[#3a1f6b] {
            background-color: #000000;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .transition-all,
          .animate-spin,
          .animate-pulse,
          .animate-fade-in {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }

          .hover\:-translate-y-1:hover,
          .hover\:-translate-y-px:hover,
          .hover\:scale-110:hover {
            transform: none !important;
          }
        }

        /* Focus styles for accessibility */
        .focus\:outline-none:focus {
          outline: 2px solid #ffa726;
          outline-offset: 2px;
        }

        /* Custom scrollbar for webkit browsers */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #2c1810;
        }

        ::-webkit-scrollbar-thumb {
          background: #5d3494;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #7e4ab8;
        }
      `}</style>
    </div>
  );
};

export default GameLayout;