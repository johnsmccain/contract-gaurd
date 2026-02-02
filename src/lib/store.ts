import { create } from 'zustand';
import { AnalysisState, AnalysisResult } from './types';

interface AppState {
  // Analysis state
  analysis: AnalysisState;
  setAnalysisStatus: (
    status: AnalysisState['status'],
    currentStep?: string,
    progress?: number
  ) => void;
  setAnalysisResult: (result: AnalysisResult) => void;
  setAnalysisError: (error: string) => void;
  resetAnalysis: () => void;

  // API key state
  apiKey: string;
  setApiKey: (key: string) => void;

  // UI state
  selectedFindingId: string | null;
  setSelectedFinding: (id: string | null) => void;
  activeTab: 'overview' | 'findings' | 'narratives' | 'insights';
  setActiveTab: (tab: AppState['activeTab']) => void;
}

const initialAnalysis: AnalysisState = {
  status: 'idle',
  progress: 0,
  currentStep: '',
  result: null,
  error: null,
};

export const useAppStore = create<AppState>((set) => ({
  // Analysis
  analysis: initialAnalysis,
  setAnalysisStatus: (status, currentStep = '', progress = 0) =>
    set((state) => ({
      analysis: {
        ...state.analysis,
        status,
        currentStep,
        progress,
        error: null,
      },
    })),
  setAnalysisResult: (result) =>
    set({
      analysis: {
        status: 'complete',
        progress: 100,
        currentStep: 'Analysis complete',
        result,
        error: null,
      },
    }),
  setAnalysisError: (error) =>
    set((state) => ({
      analysis: {
        ...state.analysis,
        status: 'error',
        error,
      },
    })),
  resetAnalysis: () => set({ analysis: initialAnalysis }),

  // API Key
  apiKey: '',
  setApiKey: (key) => set({ apiKey: key }),

  // UI
  selectedFindingId: null,
  setSelectedFinding: (id) => set({ selectedFindingId: id }),
  activeTab: 'overview',
  setActiveTab: (tab) => set({ activeTab: tab }),
}));
