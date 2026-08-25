import React, { useState } from 'react';
import { UserProgressProvider, useUserProgress } from './context/UserProgressContext';
import { QuestionDbProvider, useQuestionDb } from './context/QuestionDbContext';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import QuestionFilter from './components/QuestionFilter';
import QuestionList from './components/QuestionList';
import ErrorNotebook from './components/ErrorNotebook';
import DetailedAnalytics from './components/DetailedAnalytics';
import FlashcardSystem from './components/FlashcardSystem';
import ExamSimulator from './components/ExamSimulator';
import DataManagementModal from './components/DataManagementModal';
import QuestionEditorModal from './components/QuestionEditorModal';
import QuickTestModal from './components/QuickTestModal';
import { filterQuestions } from './data/questionsLoader';

function MainApp() {
  const { progress } = useUserProgress();
  const { questions } = useQuestionDb();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [isQuickTestOpen, setIsQuickTestOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  const [filters, setFilters] = useState({
    year: 'all',
    area: 'all',
    subarea: 'all',
    difficulty: 'all',
    status: 'all',
    search: ''
  });

  const filteredQuestions = filterQuestions(questions, filters, progress);

  const handleSelectFilterFromDashboard = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
    setActiveTab('questions');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenEditQuestion = (question) => {
    setEditingQuestion(question);
    setIsEditModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDataModal={() => setIsDataModalOpen(true)}
        onOpenQuickTest={() => setIsQuickTestOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Tab 1: Dashboard Analytics */}
        {activeTab === 'dashboard' && (
          <Dashboard onSelectFilter={handleSelectFilterFromDashboard} />
        )}

        {/* Tab 2: Matriz Completa & Diagnóstico */}
        {activeTab === 'matrix' && (
          <DetailedAnalytics
            onOpenQuickTest={() => setIsQuickTestOpen(true)}
            onSelectFilter={handleSelectFilterFromDashboard}
          />
        )}

        {/* Tab 2: Banco de Questões */}
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
            />
          </div>
        )}

        {/* Tab 3: Caderno de Erros */}
        {activeTab === 'errors' && (
          <ErrorNotebook
            onNavigateToQuestions={() => setActiveTab('questions')}
          />
        )}

        {/* Tab 4: Flashcards Anki SM-2 */}
        {activeTab === 'flashcards' && (
          <FlashcardSystem />
        )}

        {/* Tab 5: Simulados & Provas */}
        {activeTab === 'simulations' && (
          <ExamSimulator />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 PNA MedPremium • Plataforma Inteligente de Questões de Residência Médica</p>
          <p className="font-medium text-slate-400">{questions.length} Questões PNA & Simulações Reclassificadas</p>
        </div>
      </footer>

      {/* Modals */}
      <DataManagementModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
      />

      <QuestionEditorModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingQuestion(null);
        }}
        questionToEdit={editingQuestion}
      />

      <QuickTestModal
        isOpen={isQuickTestOpen}
        onClose={() => setIsQuickTestOpen(false)}
        onOpenEditModal={(q) => {
          setIsQuickTestOpen(false);
          handleOpenEditQuestion(q);
        }}
      />
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
