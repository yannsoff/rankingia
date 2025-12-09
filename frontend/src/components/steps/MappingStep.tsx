import { useState, useEffect } from 'react';
import { CheckCircle, ArrowLeft, ArrowRight, Settings } from 'lucide-react';
import { datasetAPI } from '../../services/api';
import type { Dataset, Stats } from '../../types';

interface MappingStepProps {
  dataset: Dataset;
  onMappingComplete: () => void;
  onBack: () => void;
}

export default function MappingStep({ dataset, onMappingComplete, onBack }: MappingStepProps) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, [dataset.id]);

  const loadStats = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await datasetAPI.getStats(dataset.id);
      setStats(response.data.stats);
    } catch (err: any) {
      console.error('Error loading stats:', err);
      setError('Erreur lors du chargement des statistiques');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    onMappingComplete();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Vérification du mapping
        </h2>
        <p className="text-gray-600">
          Les colonnes ont été automatiquement mappées. Vérifiez les statistiques ci-dessous.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Success indicator */}
      <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
        <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Mapping automatique réussi</p>
          <p className="text-sm">
            Toutes les colonnes du fichier Ranklist ont été correctement identifiées
          </p>
        </div>
      </div>

      {/* Column mapping info */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Colonnes détectées</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { excel: 'Prénom / Nom', internal: 'Nom complet du collaborateur' },
            { excel: 'Rang', internal: 'Catégorie de rang (CN, CD, FC, etc.)' },
            { excel: 'Unités brutes (perso)', internal: 'Unités personnelles' },
            { excel: 'Unités brutes (global)', internal: 'Unités globales' },
            { excel: 'Unités brutes (parallèles)', internal: 'Unités parallèles' },
            { excel: 'Coach', internal: 'Informations du coach' },
          ].map((mapping, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-700">
                <span className="font-medium">{mapping.excel}</span> → {mapping.internal}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Statistiques des données
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Collaborateurs</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalRows}</p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Unités perso</p>
              <p className="text-3xl font-bold text-primary-600">
                {stats.totalUnitsBrutPersonal.toFixed(0)}
              </p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Unités global</p>
              <p className="text-3xl font-bold text-primary-600">
                {stats.totalUnitsBrutGlobal.toFixed(0)}
              </p>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-xs text-gray-600 mb-1">Total unités</p>
              <p className="text-3xl font-bold text-primary-700">
                {stats.totalUnits.toFixed(0)}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Catégories de rang</p>
              <p className="text-2xl font-bold text-gray-900">{stats.uniqueRankCategories}</p>
              <p className="text-xs text-gray-500 mt-1">catégories différentes</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Coachs</p>
              <p className="text-2xl font-bold text-gray-900">{stats.uniqueCoaches}</p>
              <p className="text-xs text-gray-500 mt-1">coachs actifs</p>
            </div>
          </div>

          {stats.avgUnitsPerCollaborator && (
            <div className="mt-4 bg-primary-50 border border-primary-200 rounded-lg p-4">
              <p className="text-sm font-medium text-primary-900 mb-1">
                Moyenne par collaborateur
              </p>
              <p className="text-2xl font-bold text-primary-700">
                {stats.avgUnitsPerCollaborator.toFixed(2)} unités
              </p>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour</span>
        </button>

        <button
          onClick={handleConfirm}
          className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
        >
          <span>Continuer</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

