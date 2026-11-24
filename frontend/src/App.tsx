import { useCallback, useEffect, useState } from 'react';
import { AuthModal, type AuthModalMode } from './components/AuthModal';
import { Board } from './components/Board';
import { Footer } from './components/Footer';
import { GameOverModal } from './components/GameOverModal';
import { Header } from './components/Header';
import { HowToPlayModal } from './components/HowToPlayModal';
import { Keyboard } from './components/Keyboard';
import { LandingView } from './components/LandingView';
import { ToastContainer } from './components/ToastContainer';
import { useAuth } from './hooks/useAuth';
import { useTermoGame } from './hooks/useTermoGame';
import { useToast } from './hooks/useToast';
import { shareResultImage } from './utils/shareResultImage';

export function App() {
  const { toasts, showToast, dismissToast } = useToast();
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthModalMode>('login');

  const openAuthModal = useCallback((mode: AuthModalMode = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const {
    user,
    isAuthenticated,
    isSubmitting: isAuthSubmitting,
    login,
    register,
    logout,
  } = useAuth({ showToast });

  const {
    attempts,
    status,
    secretWord,
    isLoadingGame,
    loadError,
    currentLetters,
    selectedCol,
    activeRowIndex,
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
  } = useTermoGame({
    user,
    isAuthenticated,
    onUnauthorized: logout,
    showToast,
  });

  // Listener global de teclado físico
  useEffect(() => {
    if (!isAuthenticated || isHowToPlayOpen || isGameOverModalOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      const { key } = event;

      if (key === 'Enter') {
        event.preventDefault();
        submitGuess();
        return;
      }

      if (key === 'Backspace') {
        event.preventDefault();
        handleBackspace();
        return;
      }

      if (key === 'ArrowLeft') {
        event.preventDefault();
        handleMoveCursor('left');
        return;
      }

      if (key === 'ArrowRight') {
        event.preventDefault();
        handleMoveCursor('right');
        return;
      }

      if (/^[a-zA-Z]$/.test(key)) {
        event.preventDefault();
        handleLetterInput(key.toUpperCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isAuthenticated,
    isHowToPlayOpen,
    isGameOverModalOpen,
    submitGuess,
    handleBackspace,
    handleMoveCursor,
    handleLetterInput,
  ]);

  const handleCopyShare = useCallback(async () => {
    try {
      const outcome = await shareResultImage({ attempts, status });
      if (outcome === 'shared') {
        showToast('Resultado do DECIFRA compartilhado!', 'success');
      } else if (outcome === 'copied') {
        showToast(
          'Imagem do resultado copiada para a área de transferência!',
          'success'
        );
      } else {
        showToast('Imagem decifra-resultado.png baixada com sucesso!', 'success');
      }
    } catch {
      showToast('Não foi possível gerar a imagem de resultado.', 'error');
    }
  }, [attempts, status, showToast]);

  return (
    <div className="flex min-h-dvh flex-col bg-[#121213] text-zinc-100">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <Header
        user={user}
        gameStatus={status}
        onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
        onOpenGameOver={() => setIsGameOverModalOpen(true)}
        onOpenAuth={() => openAuthModal('login')}
        onLogout={() => logout('Você saiu da sua conta.')}
      />

      {!isAuthenticated ? (
        <>
          <LandingView
            onPlay={() => openAuthModal('login')}
            onRegister={() => openAuthModal('register')}
          />
          <AuthModal
            isOpen={isAuthModalOpen}
            initialMode={authModalMode}
            isSubmitting={isAuthSubmitting}
            onClose={() => setIsAuthModalOpen(false)}
            onLogin={login}
            onRegister={register}
          />
        </>
      ) : (
        <main className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-between px-2 py-2 sm:py-4">
          {/* 1. Estado: LOADING */}
          {isLoadingGame && (
            <div className="my-auto flex flex-col items-center justify-center gap-3 py-16">
              <div className="h-9 w-9 animate-spin rounded-full border-[3px] border-[#3aa394] border-t-transparent" />
              <p className="text-sm font-medium text-zinc-400">
                Carregando partida de hoje...
              </p>
            </div>
          )}

          {/* 2. Estado: ERROR */}
          {!isLoadingGame && loadError && (
            <div className="my-auto flex flex-col items-center justify-center rounded-2xl border border-zinc-800 bg-[#18181b] p-6 text-center">
              <p className="mb-1 text-base font-bold text-red-300">
                Não foi possível carregar o jogo
              </p>
              <p className="mb-5 text-xs text-zinc-400">{loadError}</p>
              <button
                type="button"
                onClick={loadTodayGame}
                className="rounded-xl bg-[#3aa394] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-[#329082]"
              >
                Tentar Novamente
              </button>
            </div>
          )}

          {/* 3 & 4. Estados: EMPTY (0 tentativas hoje) e SUCCESS (partida em andamento ou finalizada) */}
          {!isLoadingGame && !loadError && (
            <>
              {attempts.length === 0 && status === 'playing' && (
                <p className="mt-1 text-center text-xs font-medium text-zinc-400">
                  Digite uma palavra de 5 letras e pressione Enter
                </p>
              )}

              <Board
                attempts={attempts}
                currentLetters={currentLetters}
                selectedCol={selectedCol}
                activeRowIndex={activeRowIndex}
                gameStatus={status}
                shakingRowIndex={shakingRowIndex}
                revealingRowIndex={revealingRowIndex}
                onSelectTile={selectTile}
              />

              <Keyboard
                keyboardStatuses={keyboardStatuses}
                disabled={!canInteract}
                onLetter={handleLetterInput}
                onBackspace={handleBackspace}
                onEnter={submitGuess}
              />
            </>
          )}
        </main>
      )}

      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />

      <GameOverModal
        isOpen={isGameOverModalOpen}
        status={status}
        attempts={attempts}
        secretWord={secretWord}
        onClose={() => setIsGameOverModalOpen(false)}
        onCopyShare={handleCopyShare}
      />

      <Footer />
    </div>
  );
}
export default App;
