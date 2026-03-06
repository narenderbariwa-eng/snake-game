import { useState, useEffect, useCallback, useRef } from 'react';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 150;
const SPEED_INCREMENT = 5;
const MIN_SPEED = 50;

const App = () => {
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  
  const directionRef = useRef(direction);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);

  const generateFood = useCallback((currentSnake: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, []);

  const resetGame = useCallback(() => {
    const initialSnake = [{ x: 10, y: 10 }];
    setSnake(initialSnake);
    setFood(generateFood(initialSnake));
    setDirection('RIGHT');
    directionRef.current = 'RIGHT';
    setGameOver(false);
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setIsPaused(false);
    setGameStarted(true);
  }, [generateFood]);

  const moveSnake = useCallback(() => {
    if (gameOver || isPaused || !gameStarted) return;

    setSnake(prevSnake => {
      const head = { ...prevSnake[0] };
      const currentDirection = directionRef.current;

      switch (currentDirection) {
        case 'UP':
          head.y -= 1;
          break;
        case 'DOWN':
          head.y += 1;
          break;
        case 'LEFT':
          head.x -= 1;
          break;
        case 'RIGHT':
          head.x += 1;
          break;
      }

      // Check wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameOver(true);
        if (score > highScore) {
          setHighScore(score);
        }
        return prevSnake;
      }

      // Check self collision
      if (prevSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true);
        if (score > highScore) {
          setHighScore(score);
        }
        return prevSnake;
      }

      const newSnake = [head, ...prevSnake];

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => prev + 10);
        setFood(generateFood(newSnake));
        setSpeed(prev => Math.max(MIN_SPEED, prev - SPEED_INCREMENT));
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [food, gameOver, isPaused, gameStarted, score, highScore, generateFood]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted && e.key === ' ') {
        resetGame();
        return;
      }

      if (gameOver && e.key === ' ') {
        resetGame();
        return;
      }

      if (e.key === ' ') {
        setIsPaused(prev => !prev);
        return;
      }

      const currentDirection = directionRef.current;
      
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (currentDirection !== 'DOWN') {
            setDirection('UP');
            directionRef.current = 'UP';
          }
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (currentDirection !== 'UP') {
            setDirection('DOWN');
            directionRef.current = 'DOWN';
          }
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (currentDirection !== 'RIGHT') {
            setDirection('LEFT');
            directionRef.current = 'LEFT';
          }
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (currentDirection !== 'LEFT') {
            setDirection('RIGHT');
            directionRef.current = 'RIGHT';
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, gameOver, resetGame]);

  useEffect(() => {
    if (gameStarted && !gameOver && !isPaused) {
      gameLoopRef.current = setInterval(moveSnake, speed);
    }

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameStarted, gameOver, isPaused, moveSnake, speed]);

  const handleDirectionButton = (newDirection: Direction) => {
    const currentDirection = directionRef.current;
    
    if (newDirection === 'UP' && currentDirection !== 'DOWN') {
      setDirection('UP');
      directionRef.current = 'UP';
    } else if (newDirection === 'DOWN' && currentDirection !== 'UP') {
      setDirection('DOWN');
      directionRef.current = 'DOWN';
    } else if (newDirection === 'LEFT' && currentDirection !== 'RIGHT') {
      setDirection('LEFT');
      directionRef.current = 'LEFT';
    } else if (newDirection === 'RIGHT' && currentDirection !== 'LEFT') {
      setDirection('RIGHT');
      directionRef.current = 'RIGHT';
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900 p-4">
      <div className="mb-4 text-center">
        <h1 className="text-4xl font-bold text-white mb-2">🐍 Snake Game</h1>
        <div className="flex gap-8 justify-center text-white">
          <div className="text-center">
            <p className="text-sm opacity-70">Score</p>
            <p className="text-2xl font-bold">{score}</p>
          </div>
          <div className="text-center">
            <p className="text-sm opacity-70">High Score</p>
            <p className="text-2xl font-bold">{highScore}</p>
          </div>
        </div>
      </div>

      <div 
        className="relative bg-gray-900 rounded-lg shadow-2xl border-4 border-green-500"
        style={{ 
          width: GRID_SIZE * CELL_SIZE, 
          height: GRID_SIZE * CELL_SIZE 
        }}
      >
        {/* Grid background */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              linear-gradient(to right, #22c55e 1px, transparent 1px),
              linear-gradient(to bottom, #22c55e 1px, transparent 1px)
            `,
            backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`
          }}
        />

        {/* Snake */}
        {snake.map((segment, index) => (
          <div
            key={index}
            className={`absolute rounded-sm transition-all duration-75 ${
              index === 0 
                ? 'bg-green-400 shadow-lg shadow-green-400/50' 
                : 'bg-green-500'
            }`}
            style={{
              width: CELL_SIZE - 2,
              height: CELL_SIZE - 2,
              left: segment.x * CELL_SIZE + 1,
              top: segment.y * CELL_SIZE + 1,
            }}
          >
            {index === 0 && (
              <div className="relative w-full h-full">
                {/* Eyes */}
                <div className="absolute w-1.5 h-1.5 bg-white rounded-full" style={{
                  top: direction === 'DOWN' ? '60%' : direction === 'UP' ? '10%' : '30%',
                  left: direction === 'RIGHT' ? '60%' : direction === 'LEFT' ? '10%' : '15%',
                }}>
                  <div className="absolute w-0.5 h-0.5 bg-black rounded-full top-0.25 left-0.25" />
                </div>
                <div className="absolute w-1.5 h-1.5 bg-white rounded-full" style={{
                  top: direction === 'DOWN' ? '60%' : direction === 'UP' ? '10%' : '30%',
                  right: direction === 'LEFT' ? '60%' : direction === 'RIGHT' ? '10%' : '15%',
                }}>
                  <div className="absolute w-0.5 h-0.5 bg-black rounded-full top-0.25 left-0.25" />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Food */}
        <div
          className="absolute bg-red-500 rounded-full shadow-lg shadow-red-500/50 animate-pulse"
          style={{
            width: CELL_SIZE - 4,
            height: CELL_SIZE - 4,
            left: food.x * CELL_SIZE + 2,
            top: food.y * CELL_SIZE + 2,
          }}
        >
          <div className="absolute w-1 h-2 bg-green-600 rounded-full -top-1 left-1/2 -translate-x-1/2" />
        </div>

        {/* Game Over Overlay */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-lg">
            <p className="text-3xl font-bold text-red-500 mb-2">Game Over!</p>
            <p className="text-white text-xl mb-4">Score: {score}</p>
            <button
              onClick={resetGame}
              className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors"
            >
              Play Again
            </button>
            <p className="text-gray-400 text-sm mt-2">Press Space to restart</p>
          </div>
        )}

        {/* Start Screen */}
        {!gameStarted && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-lg">
            <p className="text-2xl font-bold text-green-400 mb-4">🐍 Snake Game</p>
            <button
              onClick={resetGame}
              className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors mb-2"
            >
              Start Game
            </button>
            <p className="text-gray-400 text-sm">Press Space or click Start</p>
          </div>
        )}

        {/* Pause Overlay */}
        {isPaused && !gameOver && gameStarted && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center rounded-lg">
            <p className="text-3xl font-bold text-yellow-400 mb-2">Paused</p>
            <p className="text-gray-400 text-sm">Press Space to resume</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-6 flex flex-col items-center gap-2">
        <button
          onClick={() => handleDirectionButton('UP')}
          className="w-14 h-14 bg-green-600 hover:bg-green-500 active:bg-green-700 rounded-lg flex items-center justify-center text-white text-2xl shadow-lg transition-colors"
          aria-label="Up"
        >
          ↑
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => handleDirectionButton('LEFT')}
            className="w-14 h-14 bg-green-600 hover:bg-green-500 active:bg-green-700 rounded-lg flex items-center justify-center text-white text-2xl shadow-lg transition-colors"
            aria-label="Left"
          >
            ←
          </button>
          <button
            onClick={() => setIsPaused(prev => !prev)}
            className="w-14 h-14 bg-yellow-600 hover:bg-yellow-500 active:bg-yellow-700 rounded-lg flex items-center justify-center text-white text-lg font-bold shadow-lg transition-colors"
            aria-label="Pause"
          >
            {isPaused ? '▶' : '⏸'}
          </button>
          <button
            onClick={() => handleDirectionButton('RIGHT')}
            className="w-14 h-14 bg-green-600 hover:bg-green-500 active:bg-green-700 rounded-lg flex items-center justify-center text-white text-2xl shadow-lg transition-colors"
            aria-label="Right"
          >
            →
          </button>
        </div>
        <button
          onClick={() => handleDirectionButton('DOWN')}
          className="w-14 h-14 bg-green-600 hover:bg-green-500 active:bg-green-700 rounded-lg flex items-center justify-center text-white text-2xl shadow-lg transition-colors"
          aria-label="Down"
        >
          ↓
        </button>
      </div>

      {/* Instructions */}
      <div className="mt-6 text-center text-white/70 text-sm">
        <p>Use Arrow keys or WASD to move</p>
        <p>Space to pause/resume</p>
      </div>
    </div>
  );
};

export default App;
