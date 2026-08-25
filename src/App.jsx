import React, { useState, useEffect } from 'react';
import { UserProgressProvider, useUserProgress } from './context/UserProgressContext';
import { QuestionDbProvider, useQuestionDb } from './context/QuestionDbContext';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import QuestionFilter from './components/QuestionFilter';
import QuestionList from './components/QuestionList';
import ErrorNotebook from './components/ErrorNotebook';
import FlashcardSystem from './components/FlashcardSystem';
import ExamSimulator from './components/ExamSimulator';
import DetailedAnalytics from './components/DetailedAnalytics';
import AchievementsPanel from './components/AchievementsPanel';
import AdaptiveStudyMode from './components/AdaptiveStudyMode';
import DailyGoalBanner from './components/DailyGoalBanner';
import DataManagementModal from './components/DataManagementModal';
import QuestionEditorModal from './components/QuestionEditorModal';
import QuickTestModal from './components/QuickTestModal';
import QuestionNoteModal from './components/QuestionNoteModal';
import { filterQuestions } from './data/questionsLoader';
import { checkNewAchievements, ACHIEVEMENTS } from './services/achievementService';

function MainApp() {
  const { progress, unlockAchievement } = useUserProgress();
  const { questions, isLoaded } = useQuestionDb();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [isQuickTestOpen, setIsQuickTestOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteQuestion, setNoteQuestion] = useState(null);
  const [newAchievementToast, setNewAchievementToast] = useState(null);

  const [filters, setFilters] = useState({
    year: 'all',
    area: 'all',
    subarea: 'all',
    difficulty: 'all',
    status: 'all',
    search: ''
  });

  const filteredQuestions = filterQuestions(questions, filters, progress);

  const answersCount = Object.keys(progress.answers || {}).length;
  const activityCount = Object.keys(progress.dailyActivity || {}).length;

  // Achievement checker
  useEffect(() => {
    const newOnes = checkNewAchievements(progress, progress.unlockedBadges || {});
    if (newOnes.length > 0) {
      newOnes.forEach(id => unlockAchievement(id));
      const ach = ACHIEVEMENTS.find(a => a.id === newOnes[0]);
      if (ach) {
        setNewAchievementToast(ach);
        setTimeout(() => setNewAchievementToast(null), 4000);
      }
    }
  }, [answersCount, activityCount]);

  const handleSelectFilterFromDashboard = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setActiveTab('questions');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenEditQuestion = (question) => {
    setEditingQuestion(question);
    setIsEditModalOpen(true);
  };

  const handleOpenNote = (question) => {
    setNoteQuestion(question);
    setIsNoteModalOpen(true);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-500/30 text-white text-3xl animate-bounce-short">
            🩺
          </div>
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight mb-2">PNA MedPremium</h2>
        <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-6">
          Carregando 5.073 questões clínicas e sincronizando banco local...
        </p>
        <div className="w-48 bg-slate-900 rounded-full h-1.5 overflow-hidden border border-white/10">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full animate-pulse w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDataModal={() => setIsDataModalOpen(true)}
        onOpenQuickTest={() => setIsQuickTestOpen(true)}
      />

      {/* Daily Goal Banner */}
      <DailyGoalBanner />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 main-with-bottom-nav">

        {activeTab === 'dashboard' && (
          <Dashboard onSelectFilter={handleSelectFilterFromDashboard} />
        )}

        {activeTab === 'matrix' && (
          <DetailedAnalytics
            onOpenQuickTest={() => setIsQuickTestOpen(true)}
            onSelectFilter={handleSelectFilterFromDashboard}
          />
        )}

        {activeTab === 'questions' && (
          <div className="space-y-6">
            <QuestionFilter
              filters={filters}
              setFilters={setFilters}
              totalFilteredCount={filteredQuestions.length}
              totalCount={questions.length}
            />
            <QuestionList
              questions={filteredQuestions}
              onEditQuestion={handleOpenEditQuestion}
              onOpenNote={handleOpenNote}
            />
          </div>
        )}

        {activeTab === 'errors' && (
          <ErrorNotebook onNavigateToQuestions={() => setActiveTab('questions')} />
        )}

        {activeTab === 'flashcards' && (
          <FlashcardSystem />
        )}

        {activeTab === 'adaptive' && (
          <AdaptiveStudyMode />
        )}

        {activeTab === 'achievements' && (
          <AchievementsPanel />
        )}

        {activeTab === 'simulations' && (
          <ExamSimulator
            onEditQuestion={handleOpenEditQuestion}
            onOpenNote={handleOpenNote}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="hidden md:block border-t border-slate-800/80 bg-slate-950 py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 PNA MedPremium • Plataforma Inteligente de Questões de Residência Médica</p>
          <p className="font-medium text-slate-400">{questions.length} Questões PNA & Simulações Reclassificadas</p>
        </div>
      </footer>

      {/* Modals */}
      <DataManagementModal isOpen={isDataModalOpen} onClose={() => setIsDataModalOpen(false)} />

      <QuestionEditorModal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditingQuestion(null); }}
        questionToEdit={editingQuestion}
      />

      <QuickTestModal
        isOpen={isQuickTestOpen}
        onClose={() => setIsQuickTestOpen(false)}
        onOpenEditModal={(q) => { setIsQuickTestOpen(false); handleOpenEditQuestion(q); }}
      />

      <QuestionNoteModal
        isOpen={isNoteModalOpen}
        onClose={() => { setIsNoteModalOpen(false); setNoteQuestion(null); }}
        question={noteQuestion}
      />

      {/* Achievement Toast Notification */}
      {newAchievementToast && (
        <div className="fixed bottom-[90px] md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:max-w-sm z-[300] animate-fadeIn">
          <div className="apple-glass rounded-3xl border border-amber-500/40 bg-amber-950/30 p-4 flex items-center gap-4 shadow-2xl shadow-amber-500/10">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-2xl shrink-0">
              {newAchievementToast.icon}
            </div>
            <div>
              <p className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider">🏆 Conquista Desbloqueada!</p>
              <p className="text-sm font-black text-white">{newAchievementToast.title}</p>
              <p className="text-xs text-slate-300">{newAchievementToast.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <UserProgressProvider>
      <QuestionDbProvider>
        <MainApp />
      </QuestionDbProvider>
    </UserProgressProvider>
  );
}
