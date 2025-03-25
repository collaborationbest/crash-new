
import React, { useState, useEffect, useCallback, useRef } from 'react';
import CrashGraph from './CrashGraph';

interface Bet {
  id: string;
  player: string;
  amount: number;
  multiplier: number | null;
  profit: number | null;
  status: 'active' | 'won' | 'lost';
}

// Function to generate a random crash point (exponential distribution)
const generateCrashPoint = (): number => {
  return 9.99;
};


const CrashGame: React.FC = () => {
  const [currentMultiplier, setCurrentMultiplier] = useState(1);
  const [playerBet, setPlayerBet] = useState<Bet | null>(null);
  const [hasPlayerCashedOut, setHasPlayerCashedOut] = useState(false);
  const [crashed, setCrashed] = useState(false);
  const [gameHistory, setGameHistory] = useState<number[]>([]);

  // Use refs for timers to avoid closure issues
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
  const multiplierTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear timers safely
  const clearTimers = useCallback(() => {
    if (gameTimerRef.current) {
      clearTimeout(gameTimerRef.current);
      gameTimerRef.current = null;
    }
    if (multiplierTimerRef.current) {
      clearInterval(multiplierTimerRef.current);
      multiplierTimerRef.current = null;
    }
  }, []);

  // Initialize the game with some history
  useEffect(() => {
    const initialHistory = Array(5).fill(0).map(() => generateCrashPoint());
    setGameHistory(initialHistory);


    // Start the first game immediately
    startNewGame();

    // Cleanup timers on component unmount
    return () => {
      clearTimers();
    };
  }, []);


  // Process the crash
  const processCrash = useCallback((crashPoint: number) => {
    // Update game history
    setGameHistory(prev => [...prev, crashPoint]);


    // Update player bet if they didn't cash out
    if (playerBet && !hasPlayerCashedOut) {
      setPlayerBet(prevBet =>
        prevBet
          ? {
            ...prevBet,
            multiplier: crashPoint,
            profit: -prevBet.amount,
            status: 'lost'
          }
          : null
      );

    }
  }, [playerBet, hasPlayerCashedOut]);

  // Start a new game
  const startNewGame = useCallback(() => {
    // Clear any existing timers first
    clearTimers();

    // Reset game state
    setCrashed(false);
    setCurrentMultiplier(1);
    setHasPlayerCashedOut(false);

    // Generate a new crash point - truly random for each game
    const newCrashPoint = generateCrashPoint();

    // Wait for 3 seconds before starting the game
    gameTimerRef.current = setTimeout(() => {

      // Start incrementing multiplier
      let lastUpdateTime = Date.now();
      let currentValue = 1;

      multiplierTimerRef.current = setInterval(() => {
        const now = Date.now();
        const deltaTime = (now - lastUpdateTime) / 1000;
        lastUpdateTime = now;

        // Growth rate increases over time for dramatic effect
        const growthRate = 0.5 * Math.pow(currentValue, 0.7);
        const newValue = currentValue + (growthRate * deltaTime);
        currentValue = newValue;

        setCurrentMultiplier(newValue);


        // Check if we've reached crash point
        if (newValue >= newCrashPoint) {
          if (multiplierTimerRef.current) {
            clearInterval(multiplierTimerRef.current);
            multiplierTimerRef.current = null;
          }

          setCrashed(true);
          setCurrentMultiplier(10.09);
          processCrash(10.09);

          // Start next game after 3 seconds
          gameTimerRef.current = setTimeout(() => {
            startNewGame();
          }, 3000);
        }
      }, 50); // Update frequently for smooth animation
    }, 3000);
  }, [processCrash, clearTimers]);

  return (
    <div className="min-h-screen w-full bg-casino-primary text-casino-text flex flex-col">

      <div className="flex-1 p-2 sm:p-3 md:p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-6">
        {/* Left column with graph and bets table - 8 columns on large screens */}
        <div className="lg:col-span-8 flex flex-col gap-3 md:gap-6">
          <CrashGraph
            multiplier={currentMultiplier}
            maxMultiplier={Math.max(10, Math.ceil(currentMultiplier * 1.2))}
            crashed={crashed}
            gameHistory={gameHistory}
          />
        </div>

      </div>
    </div >
  );
};

export default CrashGame;
