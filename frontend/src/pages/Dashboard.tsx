import { useState } from 'react';
import { LogOut, TrendingUp } from 'lucide-react';
import Stepper from '../components/Stepper';
import UploadStep from '../components/steps/UploadStep';
import MappingStep from '../components/steps/MappingStep';
import IndicatorStep from '../components/steps/IndicatorStep';
import RankingStep from '../components/steps/RankingStep';
import type { Dataset, Ranking } from '../types';

interface DashboardProps {
  onLogout: () => void;
}

export type Step = 1 | 2 | 3 | 4;

export default function Dashboard({ onLogout }: DashboardProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [_selectedIndicatorId, setSelectedIndicatorId] = useState<string | null>(null);
  const [ranking, setRanking] = useState<Ranking | null>(null);

  const steps = [
    { number: 1, title: 'Upload', description: 'Importer le fichier' },
    { number: 2, title: 'Mapping', description: 'Vérifier les colonnes' },
    { number: 3, title: 'Indicateurs', description: 'Choisir un indicateur' },
    { number: 4, title: 'Ranking', description: 'Visualiser & Exporter' },
  ];

  const handleUploadComplete = (uploadedDataset: Dataset) => {
    setDataset(uploadedDataset);
    setCurrentStep(2);
  };

  const handleMappingComplete = () => {
    setCurrentStep(3);
  };

  const handleIndicatorSelected = (indicatorId: string) => {
    setSelectedIndicatorId(indicatorId);
  };

  const handleRankingComputed = (computedRanking: Ranking) => {
    setRanking(computedRanking);
    setCurrentStep(4);
  };

  const handleBackToStep = (step: Step) => {
    setCurrentStep(step);
  };

  const handleNewAnalysis = () => {
    setCurrentStep(1);
    setDataset(null);
    setSelectedIndicatorId(null);
    setRanking(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-primary-600 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">OVB Ranklist Analyzer</h1>
                <p className="text-xs text-gray-500">Analyse de données de production</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {dataset && (
                <button
                  onClick={handleNewAnalysis}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition"
                >
                  Nouvelle analyse
                </button>
              )}
              <button
                onClick={onLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stepper */}
        <div className="mb-8">
          <Stepper steps={steps} currentStep={currentStep} />
        </div>

        {/* Step content */}
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 min-h-[500px]">
          {currentStep === 1 && (
            <UploadStep onUploadComplete={handleUploadComplete} />
          )}

          {currentStep === 2 && dataset && (
            <MappingStep
              dataset={dataset}
              onMappingComplete={handleMappingComplete}
              onBack={() => handleBackToStep(1)}
            />
          )}

          {currentStep === 3 && dataset && (
            <IndicatorStep
              dataset={dataset}
              onIndicatorSelected={handleIndicatorSelected}
              onRankingComputed={handleRankingComputed}
              onBack={() => handleBackToStep(2)}
            />
          )}

          {currentStep === 4 && ranking && dataset && (
            <RankingStep
              ranking={ranking}
              dataset={dataset}
              onBack={() => handleBackToStep(3)}
              onAdjust={() => handleBackToStep(2)}
            />
          )}
        </div>
      </main>
    </div>
  );
}

