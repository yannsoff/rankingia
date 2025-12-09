import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, Plus, PlayCircle, Copy, Trash2, X, Layers, UserCheck } from 'lucide-react';
import { indicatorAPI, rankingAPI } from '../../services/api';
import type { Dataset, IndicatorDefinition, Ranking } from '../../types';
import MixedRanksModal from '../modals/MixedRanksModal';
import SingleRankModal from '../modals/SingleRankModal';

interface IndicatorStepProps {
  dataset: Dataset;
  onIndicatorSelected: (indicatorId: string) => void;
  onRankingComputed: (ranking: Ranking) => void;
  onBack: () => void;
}

export default function IndicatorStep({
  dataset,
  onIndicatorSelected,
  onRankingComputed,
  onBack
}: IndicatorStepProps) {
  const [indicators, setIndicators] = useState<IndicatorDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isComputing, setIsComputing] = useState(false);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMixedRanksModal, setShowMixedRanksModal] = useState(false);
  const [showSingleRankModal, setShowSingleRankModal] = useState(false);

  useEffect(() => {
    loadIndicators();
  }, []);

  const loadIndicators = async () => {
    setIsLoading(true);
    try {
      const response = await indicatorAPI.getAll();
      setIndicators(response.data.indicators);
    } catch (err: any) {
      console.error('Error loading indicators:', err);
      setError('Erreur lors du chargement des indicateurs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunIndicator = async (indicator: IndicatorDefinition) => {
    setIsComputing(true);
    setError('');

    try {
      onIndicatorSelected(indicator.id);
      
      const response = await rankingAPI.compute(indicator.id, dataset.id);
      onRankingComputed(response.data.ranking);
    } catch (err: any) {
      console.error('Error computing ranking:', err);
      setError(err.response?.data?.error || 'Erreur lors du calcul du ranking');
    } finally {
      setIsComputing(false);
    }
  };

  const handleDuplicate = async (indicator: IndicatorDefinition) => {
    try {
      await indicatorAPI.duplicate(indicator.id);
      await loadIndicators();
    } catch (err: any) {
      console.error('Error duplicating indicator:', err);
      setError('Erreur lors de la duplication');
    }
  };

  const handleDelete = async (indicator: IndicatorDefinition) => {
    if (!confirm(`Supprimer l'indicateur "${indicator.name}" ?`)) {
      return;
    }

    try {
      await indicatorAPI.delete(indicator.id);
      await loadIndicators();
    } catch (err: any) {
      console.error('Error deleting indicator:', err);
      setError('Erreur lors de la suppression');
    }
  };

  const predefinedIndicators = indicators.filter(i => i.type === 'predefined');
  const customIndicators = indicators.filter(i => i.type === 'custom');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des indicateurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Choisir un indicateur
          </h2>
          <p className="text-gray-600">
            Sélectionnez un indicateur prédéfini ou créez-en un personnalisé
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Créer un indicateur</span>
          </button>
        </div>
      </div>

      {/* Advanced Ranking Options */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">
          Options de ranking avancées
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Mixed Ranks Mode */}
          <button
            onClick={() => setShowMixedRanksModal(true)}
            className="flex items-start gap-3 p-3 bg-white border border-primary-200 rounded-lg hover:border-primary-400 hover:shadow-md transition text-left"
          >
            <div className="p-2 bg-primary-100 rounded-lg flex-shrink-0">
              <Layers className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 text-sm mb-1">
                Ranking multi-rangs
              </h4>
              <p className="text-xs text-gray-600">
                Combinez jusqu'à 3 rangs avec des opérations spéciales (CN/CD)
              </p>
            </div>
          </button>

          {/* Single Rank Mode */}
          <button
            onClick={() => setShowSingleRankModal(true)}
            className="flex items-start gap-3 p-3 bg-white border border-blue-200 rounded-lg hover:border-blue-400 hover:shadow-md transition text-left"
          >
            <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
              <UserCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 text-sm mb-1">
                Sélection manuelle
              </h4>
              <p className="text-xs text-gray-600">
                Choisissez un rang et sélectionnez manuellement les collaborateurs
              </p>
            </div>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Predefined Indicators */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary-600" />
          Indicateurs prédéfinis
        </h3>

        <div className="grid grid-cols-1 gap-3">
          {predefinedIndicators.map(indicator => (
            <IndicatorCard
              key={indicator.id}
              indicator={indicator}
              onRun={() => handleRunIndicator(indicator)}
              onDuplicate={() => handleDuplicate(indicator)}
              isComputing={isComputing}
            />
          ))}
        </div>
      </div>

      {/* Custom Indicators */}
      {customIndicators.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Indicateurs personnalisés
          </h3>

          <div className="grid grid-cols-1 gap-3">
            {customIndicators.map(indicator => (
              <IndicatorCard
                key={indicator.id}
                indicator={indicator}
                onRun={() => handleRunIndicator(indicator)}
                onDuplicate={() => handleDuplicate(indicator)}
                onDelete={() => handleDelete(indicator)}
                isComputing={isComputing}
              />
            ))}
          </div>
        </div>
      )}

      {/* Back button */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour</span>
        </button>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateIndicatorModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            loadIndicators();
          }}
        />
      )}

      {/* Mixed Ranks Modal */}
      {showMixedRanksModal && (
        <MixedRanksModal
          dataset={dataset}
          onClose={() => setShowMixedRanksModal(false)}
          onRankingComputed={(ranking) => {
            setShowMixedRanksModal(false);
            onRankingComputed(ranking);
          }}
        />
      )}

      {/* Single Rank Modal */}
      {showSingleRankModal && (
        <SingleRankModal
          dataset={dataset}
          onClose={() => setShowSingleRankModal(false)}
          onRankingComputed={(ranking) => {
            setShowSingleRankModal(false);
            onRankingComputed(ranking);
          }}
        />
      )}
    </div>
  );
}

// Indicator Card Component
interface IndicatorCardProps {
  indicator: IndicatorDefinition;
  onRun: () => void;
  onDuplicate: () => void;
  onDelete?: () => void;
  isComputing: boolean;
}

function IndicatorCard({ indicator, onRun, onDuplicate, onDelete, isComputing }: IndicatorCardProps) {
  const getGroupByLabel = (groupBy: string) => {
    switch (groupBy) {
      case 'collaborator': return 'Par collaborateur';
      case 'coach': return 'Par coach';
      case 'rank_category': return 'Par catégorie';
      default: return groupBy;
    }
  };

  const getMetricLabel = (metric: string) => {
    const labels: Record<string, string> = {
      unitsBrutPersonal: 'Unités perso',
      unitsBrutGlobal: 'Unités global',
      totalUnits: 'Unités totales',
      nbDealsPersonal: 'Nb affaires perso',
      nbDealsGlobal: 'Nb affaires global',
    };
    return labels[metric] || metric;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:shadow-md transition">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">{indicator.name}</h4>
          {indicator.description && (
            <p className="text-sm text-gray-600 mb-2">{indicator.description}</p>
          )}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
              {getGroupByLabel(indicator.groupBy)}
            </span>
            <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded">
              {getMetricLabel(indicator.metricField)}
            </span>
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
              {indicator.aggregation}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRun}
            disabled={isComputing}
            className="flex items-center gap-1 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 text-sm font-medium"
          >
            <PlayCircle className="w-4 h-4" />
            <span>Exécuter</span>
          </button>

          <button
            onClick={onDuplicate}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
            title="Dupliquer"
          >
            <Copy className="w-4 h-4" />
          </button>

          {onDelete && indicator.type === 'custom' && (
            <button
              onClick={onDelete}
              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
              title="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Create Indicator Modal
interface CreateIndicatorModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function CreateIndicatorModal({ onClose, onCreated }: CreateIndicatorModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    groupBy: 'collaborator',
    metricField: 'totalUnits',
    aggregation: 'sum',
    sortOrder: 'desc',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      await indicatorAPI.create(formData);
      onCreated();
    } catch (err: any) {
      console.error('Error creating indicator:', err);
      setError(err.response?.data?.error || 'Erreur lors de la création');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-900">Créer un indicateur</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom de l'indicateur *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grouper par *
            </label>
            <select
              value={formData.groupBy}
              onChange={(e) => setFormData({ ...formData, groupBy: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="collaborator">Collaborateur</option>
              <option value="coach">Coach</option>
              <option value="rank_category">Catégorie de rang</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Métrique *
            </label>
            <select
              value={formData.metricField}
              onChange={(e) => setFormData({ ...formData, metricField: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="totalUnits">Unités totales</option>
              <option value="unitsBrutPersonal">Unités brutes perso</option>
              <option value="unitsBrutGlobal">Unités brutes global</option>
              <option value="unitsBrutParallel">Unités brutes parallèles</option>
              <option value="nbDealsPersonal">Nombre d'affaires perso</option>
              <option value="nbDealsGlobal">Nombre d'affaires global</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Agrégation *
            </label>
            <select
              value={formData.aggregation}
              onChange={(e) => setFormData({ ...formData, aggregation: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="sum">Somme</option>
              <option value="avg">Moyenne</option>
              <option value="count">Nombre</option>
              <option value="min">Minimum</option>
              <option value="max">Maximum</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ordre de tri *
            </label>
            <select
              value={formData.sortOrder}
              onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="desc">Décroissant (du plus grand au plus petit)</option>
              <option value="asc">Croissant (du plus petit au plus grand)</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

