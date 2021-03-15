import React, {useReducer, useRef} from 'react';
import './App.css';

// snake: head -> body -> tail
const arenaSize = 10;
const initialState = {snake: ['10', '00'], movementDirection: 'right', eggPosition: null, currentPoints: 0};
const movementSpeed = 600;

const reducer = (state, action) => {
  switch (action.type) {
    case 'initial':
      return {...state, ...initialState};

    case 'changeSnake':
      return {...state, snake: action.snake};

    case 'changeMovementDirection':
      return {...state, movementDirection: action.movementDirection};

    case 'egg':
      return {...state, egg: action.egg};

    case 'changeCurrentPoints':
      return {...state, currentPoints: state.currentPoints + 1};

    case 'changeBestPoints':
      return (state.currentPoints > state.bestPoints) ? {...state, bestPoints: state.currentPoints} : {...state};

    default:
      throw new Error();
  }
};

function App() {
  const [state, dispatch] = useReducer(reducer, {...initialState, bestPoints: 0});
  let [gameStarted, setGameStarted] = React.useState(false);
  let [result, setResult] = React.useState(null);
  const mdRef = useRef(state.movementDirection);
  mdRef.current = state.movementDirection;
  const snakeRef = useRef(state.snake);
  snakeRef.current = state.snake;

  const handler = (event) => {
    event.preventDefault();

    switch (event.key) {
      case 'ArrowUp':
      case 'w':
        if (snakeRef.current[1][1] >= snakeRef.current[0][1])
          dispatch({type: 'changeMovementDirection', movementDirection: 'up'});
        break;

      case 'ArrowDown':
      case 's':
        if (snakeRef.current[1][1] <= snakeRef.current[0][1])
          dispatch({type: 'changeMovementDirection', movementDirection: 'down'});
        break;

      case 'ArrowLeft':
      case 'a':
        if (snakeRef.current[1][0] >= snakeRef.current[0][0])
          dispatch({type: 'changeMovementDirection', movementDirection: 'left'});
        break;

      case 'ArrowRight':
      case 'd':
        if (snakeRef.current[1][0] <= snakeRef.current[0][0])
          dispatch({type: 'changeMovementDirection', movementDirection: 'right'});
        break;

      default:
        break;
    }
  };

  const moveSnake = () => {
    let newSnake = state.snake.slice(0, -1),
      newPosition = (parseInt(newSnake[0][0], 16) + (mdRef.current === 'right' ? 1 : (mdRef.current === 'left' ? -1 : 0))).toString(16) + (parseInt(newSnake[0][1], 16) + (mdRef.current === 'down' ? 1 : (mdRef.current === 'up' ? -1 : 0))).toString(16);

    if (newPosition[0] >= arenaSize.toString(16) || newPosition[0] < '0' || newPosition[1] >= arenaSize.toString(16) || newPosition[1] < '0') {
      loseGame();
      return;
    }

    if (newSnake.includes(newPosition)) {
      loseGame();
      return;
    }

    newSnake.unshift(newPosition);

    if (newPosition === state.egg) {
      newSnake.push(state.snake[state.snake.length - 1]);

      let egg = generateEgg(newSnake);
      if (!egg) winGame();

      dispatch({type: 'changeCurrentPoints'});
      dispatch({type: 'egg', egg: egg});
    }

    dispatch({type: 'changeSnake', snake: newSnake});
  };

  React.useEffect(() => {
    if (gameStarted) {
      const timer = window.setTimeout(moveSnake, movementSpeed);
      return () => {
        window.clearTimeout(timer);
      };
    }
  }, [state.snake, gameStarted]);

  const startGame = () => {
    if (gameStarted) return;
    setGameStarted(true);
    setResult(null);
    dispatch({type: 'initial'});
    dispatch({type: 'egg', egg: generateEgg(state.snake)});
    window.addEventListener('keydown', handler);
  };

  const loseGame = () => {
    window.removeEventListener('keydown', handler);
    setGameStarted(false);
    setResult('You lose, try again');
    dispatch({type: 'changeBestPoints'});
  };

  const winGame = () => {
    window.removeEventListener('keydown', handler);
    setGameStarted(false);
    setResult('You win');
    dispatch({type: 'changeBestPoints'});
  };

  const renderArena = () => {
    let arena = [],
      snake = state.snake,
      snakeLength = snake.length;

    for (let i = 0; i < arenaSize; i++) {
      let children = [];
      for (let j = 0; j < arenaSize; j++) {
        let oddEvenClass = (i + j) % 2 ? 'odd' : 'even',
          currentCell = i.toString(16) + j.toString(16),
          snakeIndex = snake.indexOf(currentCell),
          snakeClass = snakeIndex !== -1 ? 'snake ' + (snakeIndex === 0 ? 'head ' + getSnakeHeadAndTailClass(snake[0], snake[1]) : (snakeIndex === snakeLength - 1 ? 'tail ' + getSnakeHeadAndTailClass(snake[snakeLength - 1], snake[snakeLength - 2]) : getSnakeBodyClass(snake[snakeIndex - 1], snake[snakeIndex], snake[snakeIndex + 1]))) : '',
          eggClass = state.egg === currentCell ? 'egg' : '';
        children.push(<div key={`cell-${i}-${j}`} className={`cell ${oddEvenClass}`}><div className={eggClass}></div><div className={snakeClass}></div></div>);
      }
      arena.push(<div key={`col-${i}`} className="col">{children}</div>);
    }

    return arena;
  };

  const generateEgg = (snake) => {
    let freeCells = [];

    for (let i = 0; i < arenaSize; i++) {
      for (let j = 0; j < arenaSize; j++) {
        let cell = i.toString(16) + j.toString(16);
        if (!snake.includes(cell))
          freeCells.push(cell);
      }
    }

    if (!freeCells.length)
      return null;

    return freeCells[Math.floor(Math.random() * Math.floor(freeCells.length))];
  };

  const getSnakeHeadAndTailClass = (firstCell, secondCell) => {
    return firstCell[0] !== secondCell[0] ? (firstCell[0] < secondCell[0] ? 'left' : 'right') : (firstCell[1] < secondCell[1] ? 'up' : 'down');
  };

  const getSnakeBodyClass = (beginCell, middleCell, endCell) => {
    if (beginCell[0] === middleCell[0] && middleCell[0] === endCell[0])
      return 'top-to-bottom';
    else if (beginCell[1] === middleCell[1] && middleCell[1] === endCell[1])
      return 'left-to-right';
    else if (beginCell[0] === middleCell[0]) {
      if (beginCell[1] < middleCell[1]) {
        if (middleCell[0] > endCell[0])
          return 'top-to-left';
        else
          return 'top-to-right';
      }
      else {
        if (middleCell[0] > endCell[0])
          return 'bottom-to-left';
        else
          return 'bottom-to-right';
      }
    }
    else {
      if (beginCell[0] < middleCell[0]) {
        if (middleCell[1] > endCell[1])
          return 'left-to-top';
        else
          return 'left-to-bottom';
      }
      else {
        if (middleCell[1] > endCell[1])
          return 'right-to-top';
        else
          return 'right-to-bottom';
      }
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <p className="game-header">Snake</p>
        <button
          onClick={startGame}
          className="button">
          Start
        </button>
      </header>
      <div className={"pointsWrapper"}>
        <div className={"pointWrapper"}>
          <div className={"pointHelper eggPoint"}></div>
          <div className={"pointCount"}>{state.currentPoints}</div>
        </div>
        {
          state.bestPoints > 0 ?
            <div className={"pointWrapper"}>
              <div className={"pointHelper bestPoint"}></div>
              <div className={"pointCount"}>{state.bestPoints}</div>
            </div> :
            null
        }
      </div>
      <div className="arena">
        {renderArena()}
      </div>
      <div className="result">
        {result}
      </div>
    </div>
  );
}

export default App;
