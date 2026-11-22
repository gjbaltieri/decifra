import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  api,
  ApiError,
  getRevealedWordForToday,
  saveRevealedWordForToday,
} from '../services/api';
import type { AttemptItem, AuthUser, GameStatus, LetterStatus } from '../types/api';
import type { ToastVariant } from './useToast';

export const MAX_ATTEMPTS = 6;
export const WORD_LENGTH = 5;

const STATUS_PRIORITY: Record<LetterStatus, number> = {
  correct: 3,
  present: 2,
  absent: 1,
};

interface UseTermoGameOptions {
  user: AuthUser | null;
  isAuthenticated: boolean;
  onUnauthorized: (message?: string) => void;
  showToast: (message: string, variant?: ToastVariant) => void;
}

export function useTermoGame({
  user,
  isAuthenticated,
  onUnauthorized,
  showToast,
}: UseTermoGameOptions) {
  const [attempts, setAttempts] = useState<AttemptItem[]>([]);
  const [status, setStatus] = useState<GameStatus>('playing');
  const [secretWord, setSecretWord] = useState<string | null>(null);

  // Estados de carregamento da tela principal (loading, error, empty, success)
  const [isLoadingGame, setIsLoadingGame] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Estado da linha ativa
  const [currentLetters, setCurrentLetters] = useState<string[]>(['', '', '', '', '']);
  const [selectedCol, setSelectedCol] = useState<number>(0);

  // Estados visuais de animação e envio
  const [isSubmittingGuess, setIsSubmittingGuess] = useState<boolean>(false);
  const [shakingRowIndex, setShakingRowIndex] = useState<number | null>(null);
  const [revealingRowIndex, setRevealingRowIndex] = useState<number | null>(null);
  const [isGameOverModalOpen, setIsGameOverModalOpen] = useState<boolean>(false);

  const shakeTimeoutRef = useRef<number | null>(null);
  const revealTimeoutRef = useRef<number | null>(null);

  const triggerRowShake = useCallback((rowIndex: number) => {
    if (shakeTimeoutRef.current) {
      window.clearTimeout(shakeTimeoutRef.current);
    }
    setShakingRowIndex(rowIndex);
    shakeTimeoutRef.current = window.setTimeout(() => {
      setShakingRowIndex(null);
    }, 520);
  }, []);

  const loadTodayGame = useCallback(async () => {
    if (!isAuthenticated || !user) return;

    setIsLoadingGame(true);
    setLoadError(null);

    try {
      const data = await api.findTodayGame();
      const sortedAttempts = [...(data.attempts || [])]
        .sort((a, b) => a.attemptNumber - b.attemptNumber)
        .map((item) => ({
          ...item,
          guess: item.guess.toUpperCase(),
        }));

      setAttempts(sortedAttempts);
      setStatus(data.status);
      setCurrentLetters(['', '', '', '', '']);
      setSelectedCol(0);

      // Se a partida já terminou, recupera a palavra secreta (da API, do palpite vencedor ou cache local do dia)
      const apiWord = data.word?.toUpperCase() || null;
      if (apiWord) {
        saveRevealedWordForToday(user.id, apiWord);
      }
      const cachedWord = getRevealedWordForToday(user.id);
      if (data.status === 'won') {
        const winningGuess =
          apiWord ||
          sortedAttempts[sortedAttempts.length - 1]?.guess ||
          cachedWord ||
          null;
        setSecretWord(winningGuess);
        setIsGameOverModalOpen(true);
      } else if (data.status === 'lost') {
        setSecretWord(apiWord || cachedWord);
        setIsGameOverModalOpen(true);
      } else {
        setSecretWord(null);
        setIsGameOverModalOpen(false);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        onUnauthorized('Sua sessão expirou. Faça login novamente.');
        return;
      }
      const message =
        err instanceof ApiError
          ? err.message
          : 'Erro ao carregar a partida de hoje.';
      setLoadError(message);
      showToast(message, 'error');
    } finally {
      setIsLoadingGame(false);
    }
  }, [isAuthenticated, user, onUnauthorized, showToast]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadTodayGame();
    } else {
      setAttempts([]);
      setStatus('playing');
      setSecretWord(null);
      setCurrentLetters(['', '', '', '', '']);
      setSelectedCol(0);
      setLoadError(null);
      setIsGameOverModalOpen(false);
    }
  }, [isAuthenticated, user, loadTodayGame]);

  useEffect(() => {
    return () => {
      if (shakeTimeoutRef.current) window.clearTimeout(shakeTimeoutRef.current);
      if (revealTimeoutRef.current) window.clearTimeout(revealTimeoutRef.current);
    };
  }, []);

  const activeRowIndex = attempts.length;
  const canInteract =
    isAuthenticated &&
    !isLoadingGame &&
    !loadError &&
    status === 'playing' &&
    activeRowIndex < MAX_ATTEMPTS &&
    !isSubmittingGuess;

  const selectTile = useCallback(
    (colIndex: number) => {
      if (!canInteract) return;
      if (colIndex >= 0 && colIndex < WORD_LENGTH) {
        setSelectedCol(colIndex);
      }
    },
    [canInteract]
  );

  const handleLetterInput = useCallback(
    (rawLetter: string) => {
      if (!canInteract) return;
      const letter = rawLetter.toUpperCase();
      if (!/^[A-Z]$/.test(letter)) return;

      setCurrentLetters((prev) => {
        const next = [...prev];
        next[selectedCol] = letter;
        return next;
      });

      setSelectedCol((prevCol) => {
        if (prevCol < WORD_LENGTH - 1) {
          return prevCol + 1;
        }
        return prevCol;
      });
    },
    [canInteract, selectedCol]
  );

  const handleBackspace = useCallback(() => {
    if (!canInteract) return;

    if (currentLetters[selectedCol] !== '') {
      setCurrentLetters((prev) => {
        const next = [...prev];
        next[selectedCol] = '';
        return next;
      });
    } else {
      const prevIndex = Math.max(0, selectedCol - 1);
      setCurrentLetters((prev) => {
        const next = [...prev];
        next[prevIndex] = '';
        return next;
      });
      setSelectedCol(prevIndex);
    }
  }, [canInteract, currentLetters, selectedCol]);

  const handleMoveCursor = useCallback(
    (direction: 'left' | 'right') => {
      if (!canInteract) return;
      setSelectedCol((prev) => {
        if (direction === 'left') return Math.max(0, prev - 1);
        return Math.min(WORD_LENGTH - 1, prev + 1);
      });
    },
    [canInteract]
  );

  const submitGuess = useCallback(async () => {
    if (!canInteract) return;

    const guessWord = currentLetters.join('');
    if (guessWord.length < WORD_LENGTH || currentLetters.some((ch) => !ch)) {
      triggerRowShake(activeRowIndex);
      showToast('Só palavras com 5 letras', 'info');
      return;
    }

    setIsSubmittingGuess(true);
    try {
      const result = await api.sendGuess({ guess: guessWord });
      const normalizedGuess = result.guess.trim().toUpperCase();

      const newAttempt: AttemptItem = {
        attemptNumber: result.attemptNumber,
        guess: normalizedGuess,
        feedback: result.feedback,
      };

      const revealedRow = attempts.length;
      setRevealingRowIndex(revealedRow);
      setAttempts((prev) => [...prev, newAttempt]);
      setCurrentLetters(['', '', '', '', '']);
      setSelectedCol(0);
      setStatus(result.status);

      const finalWord =
        result.word?.toUpperCase() ||
        (result.status === 'won' ? normalizedGuess : null);

      if (finalWord && user) {
        setSecretWord(finalWord);
        saveRevealedWordForToday(user.id, finalWord);
      }

      const flipDurationMs = WORD_LENGTH * 130 + 450;
      revealTimeoutRef.current = window.setTimeout(() => {
        setRevealingRowIndex(null);
        if (result.status === 'won') {
          const praise = [
            'Genial!',
            'Sensacional!',
            'Mandou muito!',
            'Excelente!',
            'Muito bom!',
            'Ufa!',
          ];
          showToast(
            praise[Math.min(result.attemptNumber - 1, praise.length - 1)],
            'success'
          );
          setIsGameOverModalOpen(true);
        } else if (result.status === 'lost') {
          if (finalWord) {
            showToast(`Palavra: ${finalWord}`, 'info');
          }
          setIsGameOverModalOpen(true);
        }
      }, flipDurationMs);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          onUnauthorized('Sua sessão expirou. Faça login novamente.');
          return;
        }
        triggerRowShake(activeRowIndex);
        showToast(err.message, 'error');
      } else {
        triggerRowShake(activeRowIndex);
        showToast('Erro ao enviar palpite.', 'error');
      }
    } finally {
      setIsSubmittingGuess(false);
    }
  }, [
    canInteract,
    currentLetters,
    activeRowIndex,
    attempts.length,
    user,
    triggerRowShake,
    showToast,
    onUnauthorized,
  ]);

  const keyboardStatuses = useMemo(() => {
    const map: Record<string, LetterStatus> = {};
    for (const attempt of attempts) {
      const letters = attempt.guess.toUpperCase().split('');
      letters.forEach((letter, idx) => {
        const statusForLetter = attempt.feedback[idx];
        if (!statusForLetter) return;
        const existing = map[letter];
        if (
          !existing ||
          STATUS_PRIORITY[statusForLetter] > STATUS_PRIORITY[existing]
        ) {
          map[letter] = statusForLetter;
        }
      });
    }
    return map;
  }, [attempts]);

  const generateShareText = useCallback(() => {
    const triesLabel = status === 'won' ? `${attempts.length}/6` : 'X/6';
    const emojiRows = attempts.map((attempt) =>
      attempt.feedback
        .map((st) => {
          if (st === 'correct') return '🟩';
          if (st === 'present') return '🟨';
          return '⬛';
        })
        .join('')
    );
    return `Joguei DECIFRA ${triesLabel}\n\n${emojiRows.join('\n')}`;
  }, [attempts, status]);

  return {
    attempts,
    status,
    secretWord,
    isLoadingGame,
    loadError,
    currentLetters,
    selectedCol,
    activeRowIndex,
    isSubmittingGuess,
    shakingRowIndex,
    revealingRowIndex,
    isGameOverModalOpen,
    setIsGameOverModalOpen,
    keyboardStatuses,
    canInteract,
    loadTodayGame,
    selectTile,
    handleLetterInput,
    handleBackspace,
    handleMoveCursor,
    submitGuess,
    generateShareText,
  };
}
